import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const decodeHtml = (input: string) =>
    input
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

const stripTags = (input: string) =>
    decodeHtml(input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());

const extractMeta = (html: string, keys: string[]) => {
    for (const key of keys) {
        const re = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
        const match = html.match(re);
        if (match?.[1]) return decodeHtml(match[1]);
    }
    return '';
};

const extractTag = (xml: string, tag: string) => {
    const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
    if (!match?.[1]) return '';
    return decodeHtml(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim());
};

const parseRssItems = (xml: string) => {
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
    return itemMatches.map((itemXml) => ({
        title: extractTag(itemXml, 'title'),
        link: extractTag(itemXml, 'link'),
        description: stripTags(extractTag(itemXml, 'description')),
        pubDate: extractTag(itemXml, 'pubDate'),
    }));
};

export async function POST(req: Request, props: { params: Promise<{ workflowId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // Load workflow
        const workflow = await prisma.workflow.findUnique({
            where: { id: params.workflowId, userId: session.user.id }
        });
        if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

        // Parse definition
        const definition = workflow.definition ? JSON.parse(workflow.definition) : {};
        const nodes = definition.nodes || [];
        const edges = definition.edges || [];

        if (nodes.length === 0) {
            return NextResponse.json({ error: "Workflow has no nodes" }, { status: 400 });
        }

        // Load user's API key and connections
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { openaiApiKey: true },
        });

        const connections = await prisma.externalConnection.findMany({
            where: { userId: session.user.id },
        });

        // Create execution record
        const execution = await prisma.workflowExecution.create({
            data: {
                workflowId: params.workflowId,
                triggerType: "manual",
                status: "running",
            },
        });

        // Build execution order via BFS
        const nodeMap = new Map(nodes.map((n: any) => [n.id, n]));
        const edgesBySource = new Map<string, string[]>();
        for (const edge of edges) {
            const targets = edgesBySource.get(edge.source) || [];
            targets.push(edge.target);
            edgesBySource.set(edge.source, targets);
        }

        const targetSet = new Set(edges.map((e: any) => e.target));
        const roots = nodes.filter((n: any) => !targetSet.has(n.id));

        const executionOrder: any[] = [];
        const visited = new Set<string>();
        const queue = [...roots];
        while (queue.length > 0) {
            const node = queue.shift()!;
            if (visited.has(node.id)) continue;
            visited.add(node.id);
            executionOrder.push(node);
            const targets = edgesBySource.get(node.id) || [];
            for (const targetId of targets) {
                const targetNode = nodeMap.get(targetId);
                if (targetNode && !visited.has(targetId)) {
                    queue.push(targetNode);
                }
            }
        }

        // Execute each node
        const results: Record<string, any> = {};
        let lastOutput = '';
        let lastTextOutput = '';  // Tracks the most recent TEXT content
        let lastImageUrl = '';    // Tracks the most recent IMAGE URL

        for (const node of executionOrder) {
            const step = await prisma.executionStep.create({
                data: {
                    executionId: execution.id,
                    nodeId: node.id,
                    nodeType: node.type || 'unknown',
                    status: "running",
                    input: JSON.stringify(node.data),
                },
            });

            try {
                let output = '';

                switch (node.type) {
                    case 'manual-trigger':
                        output = node.data?.testContent || 'Manual trigger fired.';
                        break;

                    case 'schedule-trigger':
                        output = 'Schedule trigger fired.';
                        break;

                    case 'rss-source': {
                        const input = (node.data?.url as string || '').trim();
                        if (!input) throw new Error('No news URL or query provided.');

                        let articleUrl = '';
                        let sourceType: 'query' | 'url' = 'url';
                        let searchQuery = '';

                        try {
                            const parsed = new URL(input);
                            if (!['http:', 'https:'].includes(parsed.protocol)) {
                                throw new Error('Only http/https article URLs are supported.');
                            }
                            articleUrl = parsed.toString();
                        } catch {
                            sourceType = 'query';
                            searchQuery = input;
                            const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=en-US&gl=US&ceid=US:en`;
                            const rssRes = await fetch(rssUrl, {
                                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SocialPosterBot/1.0)' },
                            });
                            if (!rssRes.ok) {
                                throw new Error(`News search failed: HTTP ${rssRes.status}`);
                            }
                            const rssXml = await rssRes.text();
                            const items = parseRssItems(rssXml);
                            const firstItem = items.find((i) => i.link);
                            if (!firstItem?.link) {
                                throw new Error(`No news results found for query: ${searchQuery}`);
                            }
                            articleUrl = firstItem.link;
                        }

                        const articleRes = await fetch(articleUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (compatible; SocialPosterBot/1.0)',
                                'Accept': 'text/html,application/xhtml+xml',
                            },
                        });

                        if (!articleRes.ok) {
                            throw new Error(`Failed to fetch article: HTTP ${articleRes.status}`);
                        }

                        const html = await articleRes.text();
                        const title =
                            extractMeta(html, ['og:title', 'twitter:title']) ||
                            (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '').trim();
                        const description =
                            extractMeta(html, ['og:description', 'description', 'twitter:description']);

                        const paragraphMatches = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi) || [];
                        const content = paragraphMatches
                            .map((p) => stripTags(p))
                            .filter((p) => p.length > 40)
                            .slice(0, 12)
                            .join('\n')
                            .slice(0, 4000);

                        if (!title && !content) {
                            throw new Error('Could not extract readable article content from this URL.');
                        }

                        output =
                            (sourceType === 'query' ? `SEARCH_QUERY: ${searchQuery}\n` : '') +
                            `SOURCE_URL: ${articleUrl}\n` +
                            `TITLE: ${title || 'Untitled'}\n` +
                            `DESCRIPTION: ${description || 'N/A'}\n` +
                            `CONTENT:\n${content || description || title}`;
                        break;
                    }

                    case 'google-sheets-source': {
                        const sheetId = (node.data?.sheetId as string) || '';
                        const sheetName = (node.data?.sheetName as string) || 'Sheet1';

                        console.log('[SHEETS-SOURCE] Starting. sheetId:', sheetId, 'sheetName:', sheetName);
                        console.log('[SHEETS-SOURCE] Full node.data:', JSON.stringify(node.data));

                        if (!sheetId) throw new Error('Spreadsheet ID is required for Google Sheets source.');

                        const spreadsheetId = normalizeSpreadsheetId(sheetId);
                        console.log('[SHEETS-SOURCE] Extracted spreadsheetId:', spreadsheetId);

                        const userWithKey = await prisma.user.findUnique({
                            where: { id: session.user.id },
                            select: { googleApiKey: true }
                        });
                        console.log('[SHEETS-SOURCE] Has API key:', !!userWithKey?.googleApiKey);

                        if (!userWithKey?.googleApiKey) {
                            throw new Error('Google API Key not found. Please configure it in Settings.');
                        }

                        // Read content and adjacent status column to find first unprocessed row
                        const contentCol = ((node.data?.sheetColumn as string) || 'A').toUpperCase();
                        const statusColCharCode = contentCol.charCodeAt(0) + 1;
                        const statusCol = String.fromCharCode(statusColCharCode > 90 ? 90 : statusColCharCode);

                        const range = `${sheetName}!${contentCol}1:${statusCol}1000`;
                        const fetchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${userWithKey.googleApiKey}`;
                        console.log('[SHEETS-SOURCE] Fetching range:', range);
                        const sheetsRes = await fetch(fetchUrl);
                        console.log('[SHEETS-SOURCE] Sheets API response status:', sheetsRes.status);

                        if (!sheetsRes.ok) {
                            const errData = await sheetsRes.json().catch(() => ({}));
                            console.error('[SHEETS-SOURCE] API error:', JSON.stringify(errData));
                            throw new Error(`Failed to fetch sheet: ${errData.error?.message || sheetsRes.statusText}`);
                        }

                        const sheetData = await sheetsRes.json();
                        const rows: string[][] = sheetData.values || [];
                        const startRow = parseStartRowFromRange(sheetData.range);
                        console.log('[SHEETS-SOURCE] Total rows fetched:', rows.length);
                        console.log('[SHEETS-SOURCE] First 5 rows:', JSON.stringify(rows.slice(0, 5)));

                        // Find first row where status column is not 'done'
                        let usedRowIndex = -1;
                        for (let i = 0; i < rows.length; i++) {
                            const cellA = (rows[i]?.[0] || '').trim(); // Content Col
                            const cellB = (rows[i]?.[1] || '').trim().toLowerCase(); // Status Col
                            if (cellA && cellB !== 'done') {
                                output = cellA;
                                usedRowIndex = i;
                                console.log('[SHEETS-SOURCE] Using row', i, '- content:', cellA.substring(0, 100));
                                break;
                            }
                        }

                        if (usedRowIndex === -1) {
                            output = 'All rows in the sheet have been processed (marked as done).';
                            console.log('[SHEETS-SOURCE] All rows done');
                        } else {
                            // Mark status column as 'done' for the used row
                            const actualRow = startRow + usedRowIndex;
                            const markRange = `${sheetName}!${statusCol}${actualRow}`;
                            console.log('[SHEETS-SOURCE] Marking row', actualRow, 'as done in range:', markRange);
                            const writeToken = await getGoogleWriteAccessToken(session.user.id);
                            console.log('[SHEETS-SOURCE] Has OAuth token:', !!writeToken);
                            const writeHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
                            let writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${markRange}?valueInputOption=USER_ENTERED`;
                            if (writeToken) {
                                writeHeaders['Authorization'] = `Bearer ${writeToken}`;
                            } else {
                                writeUrl += `&key=${userWithKey.googleApiKey}`;
                            }
                            try {
                                const markRes = await fetch(writeUrl, {
                                    method: 'PUT',
                                    headers: writeHeaders,
                                    body: JSON.stringify({ values: [['done']] }),
                                });
                                const markText = await markRes.text();
                                console.log('[SHEETS-SOURCE] Mark-done response:', markRes.status, markText);
                                if (!markRes.ok) {
                                    throw new Error(`Failed to mark row ${actualRow} as done: ${markText || markRes.statusText}`);
                                }
                            } catch (markErr) {
                                throw new Error(`Failed to mark row as done: ${markErr}`);
                            }
                        }
                        console.log('[SHEETS-SOURCE] Final output:', output.substring(0, 200));
                        break;
                    }

                    case 'ai-generation': {
                        if (!user?.openaiApiKey) {
                            throw new Error('No OpenAI API key configured. Go to Settings → API Keys.');
                        }

                        // 1. Determine Input content based on Content Source
                        let inputContent = '';
                        const contentSource = (node.data?.contentSource as string) || 'upstream';

                        if (contentSource === 'rss') {
                            const rssUrl = (node.data?.rssUrl as string || '').trim();
                            if (rssUrl) {
                                try {
                                    // Basic RSS Fetch (simplified version of rss-source logic)
                                    const rssRes = await fetch(rssUrl.startsWith('http') ? rssUrl : `https://news.google.com/rss/search?q=${encodeURIComponent(rssUrl)}`, {
                                        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SocialPosterBot/1.0)' },
                                    });
                                    if (rssRes.ok) {
                                        const rssXml = await rssRes.text();
                                        const items = parseRssItems(rssXml);
                                        // Get first item
                                        const firstItem = items.find((i) => i.link);
                                        if (firstItem) {
                                            inputContent = `Title: ${firstItem.title}\nLink: ${firstItem.link}\nDescription: ${firstItem.description}`;
                                        }
                                    }
                                } catch (e) {
                                    console.error("Failed to fetch RSS in AI node:", e);
                                    inputContent = `Error fetching RSS: ${rssUrl}`;
                                }
                            }
                        } else if (contentSource === 'google-sheets') {
                            const sheetId = normalizeSpreadsheetId((node.data?.sheetId as string) || '');
                            const tab = (node.data?.sheetTab as string) || 'Sheet1';
                            const contentCol = ((node.data?.sheetColumn as string) || 'A').toUpperCase();
                            const statusColCharCode = contentCol.charCodeAt(0) + 1;
                            const statusCol = String.fromCharCode(statusColCharCode > 90 ? 90 : statusColCharCode);

                            const userWithKey = await prisma.user.findUnique({ where: { id: session.user.id }, select: { googleApiKey: true } });

                            if (userWithKey?.googleApiKey && sheetId) {
                                try {
                                    const range = `${tab}!${contentCol}1:${statusCol}1000`;
                                    const sheetsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${userWithKey.googleApiKey}`);
                                    if (sheetsRes.ok) {
                                        const sheetData = await sheetsRes.json();
                                        const rows: string[][] = sheetData.values || [];
                                        const startRow = parseStartRowFromRange(sheetData.range);

                                        let usedRowIndex = -1;
                                        for (let i = 0; i < rows.length; i++) {
                                            const cellA = (rows[i]?.[0] || '').trim(); // Content Col
                                            const cellB = (rows[i]?.[1] || '').trim().toLowerCase(); // Status Col
                                            if (cellA && cellB !== 'done') {
                                                inputContent = cellA;
                                                usedRowIndex = i;
                                                break;
                                            }
                                        }

                                        if (usedRowIndex === -1) {
                                            inputContent = 'All rows in the sheet have been processed (marked as done).';
                                        } else {
                                            const actualRow = startRow + usedRowIndex;
                                            const markRange = `${tab}!${statusCol}${actualRow}`;
                                            let writeToken = await getGoogleWriteAccessToken(session.user.id);
                                            const writeHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
                                            let writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(markRange)}?valueInputOption=USER_ENTERED`;
                                            if (writeToken) {
                                                writeHeaders['Authorization'] = `Bearer ${writeToken}`;
                                            } else {
                                                writeUrl += `&key=${userWithKey.googleApiKey}`;
                                            }
                                            try {
                                                let markRes = await fetch(writeUrl, {
                                                    method: 'PUT',
                                                    headers: writeHeaders,
                                                    body: JSON.stringify({ values: [['done']] }),
                                                });
                                                if (!markRes.ok && writeToken && (markRes.status === 401 || markRes.status === 403)) {
                                                    // Token may be stale; force refresh and retry once.
                                                    writeToken = await getGoogleWriteAccessToken(session.user.id, true);
                                                    if (writeToken) {
                                                        markRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(markRange)}?valueInputOption=USER_ENTERED`, {
                                                            method: 'PUT',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${writeToken}`,
                                                            },
                                                            body: JSON.stringify({ values: [['done']] }),
                                                        });
                                                    }
                                                }
                                                if (!markRes.ok) {
                                                    const markText = await markRes.text();
                                                    console.error('[AI-GEN] Failed to mark row as done:', markText || markRes.statusText);
                                                }
                                            } catch (markErr) {
                                                console.error('[AI-GEN] Failed to mark row as done', markErr);
                                            }
                                        }
                                    } else {
                                        inputContent = `Error fetching Sheet: ${sheetsRes.statusText}`;
                                    }
                                } catch (e) {
                                    inputContent = `Error fetching Sheet: ${e}`;
                                }
                            } else {
                                inputContent = "Google Sheets source requires a Google API Key in Settings and a valid Spreadsheet ID.";
                            }
                        } else {
                            // Upstream
                            inputContent = lastTextOutput || lastOutput || '';
                        }


                        const persona = node.data?.masterPrompt || 'You are a helpful assistant.';
                        let taskPrompt = node.data?.taskPrompt || 'Generate content.';

                        if (taskPrompt.includes('{{content}}')) {
                            taskPrompt = taskPrompt.replace('{{content}}', inputContent);
                        } else if (inputContent && !taskPrompt.includes('{{content}}')) {
                            // Auto-append source content if available
                            taskPrompt = taskPrompt + '\n\nSource material to work with:\n' + inputContent;
                        }

                        // Detect downstream publisher nodes to add platform-specific context
                        const downstreamIds = edgesBySource.get(node.id) || [];
                        const platforms: string[] = [];
                        for (const tid of downstreamIds) {
                            const tNode = nodeMap.get(tid) as any;
                            if (tNode?.type?.includes('publisher')) {
                                const p = (tNode.type as string).replace('-publisher', '');
                                platforms.push(p.charAt(0).toUpperCase() + p.slice(1));
                            }
                            // Also check nodes downstream of that node
                            const grandChildren = edgesBySource.get(tid) || [];
                            for (const gcid of grandChildren) {
                                const gcNode = nodeMap.get(gcid) as any;
                                if (gcNode?.type?.includes('publisher')) {
                                    const p = (gcNode.type as string).replace('-publisher', '');
                                    platforms.push(p.charAt(0).toUpperCase() + p.slice(1));
                                }
                            }
                        }

                        // HUMAN-LIKE PROMPT ENGINEERING
                        let socialContext = '';
                        if (platforms.length > 0) {
                            socialContext = `\n\nIMPORTANT FORMATTING RULES:\n- You are writing a social media post for: ${platforms.join(', ')}.\n- Write ONLY the post text, ready to publish. Do NOT use markdown formatting (no #, ##, ###, **, etc.).\n- Keep it concise, engaging, and appropriate for social media.\n- Do NOT write a blog article. Write a single, complete social media post.\n- Maximum 280 characters for Twitter/X, up to 2000 characters for LinkedIn/Facebook.\n- Include relevant hashtags at the end if appropriate.`;
                        }

                        // Add "Human-like" negative constraints
                        const humanInstructions = `\n\nCRITICAL STYLE INSTRUCTIONS:
- Write like a real human, not an AI. Use conversational, natural language.
- AVOID these words/phrases: "unlock", "elevate", "game-changer", "dive in", "landscape", "testament", "tapestry", "bustling", "mastering".
- Do not use robotic transitions like "In conclusion" or "Moreover".
- Use varied sentence structure. Be punchy.
- Show personality and authenticity.`;

                        const enhancedPersona = persona + humanInstructions + socialContext;

                        const response = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${user.openaiApiKey}`,
                            },
                            body: JSON.stringify({
                                model: 'gpt-4o-mini',
                                messages: [
                                    { role: 'system', content: enhancedPersona },
                                    { role: 'user', content: taskPrompt },
                                ],
                                max_tokens: platforms.length > 0 ? 300 : 500,
                            }),
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(`OpenAI error: ${errorData.error?.message || 'Unknown'}`);
                        }

                        const aiData = await response.json();
                        output = aiData.choices[0]?.message?.content || 'No content generated.';
                        break;
                    }

                    case 'blog-creation': {
                        // 1. Determine Source Text
                        let sourceText = '';
                        const rawContentSource = (node.data?.contentSource as string) || 'upstream';
                        const contentSource = rawContentSource === 'google-sheets' ? 'upstream' : rawContentSource;

                        if (contentSource === 'rss') {
                            const rssUrl = (node.data?.rssUrl as string || '').trim();
                            if (rssUrl) {
                                try {
                                    const rssRes = await fetch(rssUrl.startsWith('http') ? rssUrl : `https://news.google.com/rss/search?q=${encodeURIComponent(rssUrl)}`, {
                                        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SocialPosterBot/1.0)' },
                                    });
                                    if (rssRes.ok) {
                                        const rssXml = await rssRes.text();
                                        const items = parseRssItems(rssXml);
                                        const firstItem = items.find((i) => i.link);
                                        if (firstItem) {
                                            sourceText = `Title: ${firstItem.title}\nLink: ${firstItem.link}\nDescription: ${firstItem.description}`;
                                        }
                                    }
                                } catch (e) {
                                    console.error("Failed to fetch RSS in Blog node:", e);
                                    sourceText = `Error fetching RSS: ${rssUrl}`;
                                }
                            }
                        } else if (contentSource === 'google-sheets') {
                            const sheetId = normalizeSpreadsheetId((node.data?.sheetId as string) || '');
                            const tab = (node.data?.sheetTab as string) || 'Sheet1';
                            const contentCol = ((node.data?.sheetColumn as string) || 'A').toUpperCase();
                            const statusColCharCode = contentCol.charCodeAt(0) + 1;
                            const statusCol = String.fromCharCode(statusColCharCode > 90 ? 90 : statusColCharCode);

                            const userWithKey = await prisma.user.findUnique({ where: { id: session.user.id }, select: { googleApiKey: true } });

                            if (userWithKey?.googleApiKey && sheetId) {
                                try {
                                    const range = `${tab}!${contentCol}1:${statusCol}1000`;
                                    const sheetsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${userWithKey.googleApiKey}`);
                                    if (sheetsRes.ok) {
                                        const sheetData = await sheetsRes.json();
                                        const rows: string[][] = sheetData.values || [];
                                        const startRow = parseStartRowFromRange(sheetData.range);

                                        let usedRowIndex = -1;
                                        for (let i = 0; i < rows.length; i++) {
                                            const cellA = (rows[i]?.[0] || '').trim(); // Content Col
                                            const cellB = (rows[i]?.[1] || '').trim().toLowerCase(); // Status Col
                                            if (cellA && cellB !== 'done') {
                                                sourceText = cellA;
                                                usedRowIndex = i;
                                                break;
                                            }
                                        }

                                        if (usedRowIndex === -1) {
                                            sourceText = 'All rows in the sheet have been processed (marked as done).';
                                        } else {
                                            const actualRow = startRow + usedRowIndex;
                                            const markRange = `${tab}!${statusCol}${actualRow}`;
                                            const writeToken = await getGoogleWriteAccessToken(session.user.id);
                                            const writeHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
                                            let writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${markRange}?valueInputOption=USER_ENTERED`;
                                            if (writeToken) {
                                                writeHeaders['Authorization'] = `Bearer ${writeToken}`;
                                            } else {
                                                writeUrl += `&key=${userWithKey.googleApiKey}`;
                                            }
                                            try {
                                                const markRes = await fetch(writeUrl, {
                                                    method: 'PUT',
                                                    headers: writeHeaders,
                                                    body: JSON.stringify({ values: [['done']] }),
                                                });
                                                if (!markRes.ok) {
                                                    const markText = await markRes.text();
                                                    throw new Error(`Failed to mark row as done: ${markText || markRes.statusText}`);
                                                }
                                            } catch (markErr) {
                                                console.error('[BLOG-CREATION] Failed to mark row as done', markErr);
                                                throw new Error(`Failed to mark row as done: ${markErr}`);
                                            }
                                        }
                                    } else {
                                        sourceText = `Error fetching Sheet: ${sheetsRes.statusText}`;
                                    }
                                } catch (e) {
                                    sourceText = `Error fetching Sheet: ${e}`;
                                }
                            } else {
                                sourceText = "Google Sheets source requires a Google API Key in Settings and a valid Spreadsheet ID.";
                            }
                        } else {
                            // Upstream
                            sourceText = lastOutput || node.data?.content || '';
                        }

                        if (!sourceText) throw new Error('No input content found for blog creation.');

                        const blogPrompt = node.data?.blogPrompt || 'Write a polished blog post with headline, sections, and conclusion.';

                        if (user?.openaiApiKey) {
                            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${user.openaiApiKey}`,
                                },
                                body: JSON.stringify({
                                    model: 'gpt-4o-mini',
                                    messages: [
                                        { role: 'system', content: 'You are a professional blog writer.' },
                                        { role: 'user', content: `${blogPrompt}\n\nSource material:\n${sourceText}` },
                                    ],
                                    max_tokens: 1200,
                                }),
                            });
                            if (!response.ok) {
                                const errorData = await response.json().catch(() => ({}));
                                throw new Error(`Blog creation failed: ${errorData.error?.message || 'Unknown error'}`);
                            }
                            const aiData = await response.json();
                            output = aiData.choices[0]?.message?.content || 'No blog content generated.';
                        } else {
                            output = `# Blog Draft\n\n${sourceText}`;
                        }
                        break;
                    }

                    case 'image-generation': {
                        const provider = node.data?.provider || 'dalle-3';
                        let prompt = (node.data?.prompt as string) || 'A creative image.';

                        // Substitute {{content}} if present
                        if (prompt.includes('{{content}}') && lastOutput) {
                            prompt = prompt.replace('{{content}}', lastOutput);
                        }

                        if (provider === 'dalle-3') {
                            // @ts-ignore
                            if (!user?.openaiApiKey) throw new Error('No OpenAI API key configured.');

                            const response = await fetch('https://api.openai.com/v1/images/generations', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    // @ts-ignore
                                    'Authorization': `Bearer ${user.openaiApiKey}`,
                                },
                                body: JSON.stringify({
                                    model: "dall-e-3",
                                    prompt: prompt,
                                    n: 1,
                                    size: "1024x1024",
                                }),
                            });

                            if (!response.ok) {
                                const err = await response.json();
                                throw new Error(`DALL-E 3 error: ${err.error?.message || 'Unknown'}`);
                            }

                            const data = await response.json();
                            output = data.data[0]?.url || '';
                            if (!output) throw new Error('DALL-E 3 generated no image URL.');

                        } else if (provider === 'nano-banana' || provider === 'gemini') {
                            // Nano Banana (Gemini 2.5 Flash Image)
                            const userWithGoogle = await prisma.user.findUnique({
                                where: { id: session.user.id },
                                select: { googleApiKey: true } // This field exists now
                            });

                            // @ts-ignore
                            if (!userWithGoogle?.googleApiKey) throw new Error('No Google API key configured for Nano Banana. Go to Settings.');

                            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${userWithGoogle.googleApiKey}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    instances: [{ prompt: prompt }],
                                    parameters: { sampleCount: 1 }
                                })
                            });

                            if (!response.ok) {
                                const errText = await response.text();
                                throw new Error(`Nano Banana error: ${errText}`);
                            }

                            const data = await response.json();
                            const b64 = data.predictions?.[0]?.bytesBase64Encoded;
                            if (!b64) throw new Error('Nano Banana returned no image data.');

                            output = `data:image/png;base64,${b64}`;
                        } else {
                            throw new Error(`Unknown image provider: ${provider}`);
                        }
                        break;
                    }



                    case 'facebook-publisher': {
                        const accountId = node.data?.accountId;
                        if (!accountId) throw new Error('No Facebook page selected. Configure the node first.');

                        const connection = connections.find(c => c.id === accountId);
                        if (!connection) throw new Error('Facebook connection not found. Reconnect in Connections page.');

                        let creds: any = {};
                        try { creds = JSON.parse(connection.credentials); } catch { }
                        const pageToken = creds.accessToken;
                        const pageId = creds.username || connection.name;

                        if (!pageToken) throw new Error('No access token found for this Facebook page.');

                        const contentToPost = lastTextOutput || lastOutput || node.data?.content || '';
                        // Check for image URL in current node config OR from tracked image
                        const imageUrl = node.data?.imageUrl || lastImageUrl || '';

                        if (imageUrl) {
                            // Link/Image Post (via Photos endpoint if it's an image, or Feed if it's just a link? FB prefers Photos for actual images)
                            // We assume it's an image if it's in the imageUrl field or comes from Image Gen.

                            const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    url: imageUrl,
                                    caption: contentToPost || '', // Caption is optional for photos
                                    access_token: pageToken,
                                }),
                            });

                            const fbData = await fbRes.json();
                            if (fbData.error) {
                                throw new Error(`Facebook API (Photo): ${fbData.error.message}`);
                            }
                            output = `✅ Posted Photo to Facebook! Post ID: ${fbData.id}`;
                            await prisma.publishResult.create({
                                data: {
                                    workflowId: params.workflowId,
                                    executionId: execution.id,
                                    platform: 'facebook',
                                    postId: fbData.id,
                                    postUrl: `https://facebook.com/${fbData.post_id || fbData.id}`, // specific post_id often returned for photos
                                    status: 'success',
                                },
                            });
                        } else {
                            if (!contentToPost) throw new Error('No content to post. Connect an AI node before this publisher.');

                            // Post Text to Facebook Page
                            const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    message: contentToPost,
                                    access_token: pageToken,
                                }),
                            });

                            const fbData = await fbRes.json();
                            if (fbData.error) {
                                throw new Error(`Facebook API: ${fbData.error.message}`);
                            }

                            output = `✅ Posted to Facebook! Post ID: ${fbData.id}`;

                            // Record publish result
                            await prisma.publishResult.create({
                                data: {
                                    workflowId: params.workflowId,
                                    executionId: execution.id,
                                    platform: 'facebook',
                                    postId: fbData.id,
                                    postUrl: `https://facebook.com/${fbData.id}`,
                                    status: 'success',
                                },
                            });
                        }
                        break;
                    }

                    case 'linkedin-publisher': {
                        const liTextContent = lastTextOutput || lastOutput || node.data?.content || '';
                        const liImageUrl = node.data?.imageUrl || lastImageUrl || '';

                        if (!liTextContent && !liImageUrl) throw new Error('No content to post. Connect an AI node before this publisher.');

                        // Get all LinkedIn connections, newest first
                        const liAccountId = node.data?.accountId;
                        const allLiConnections = connections
                            .filter(c => c.provider === 'linkedin')
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                        // Put selected account first if it exists, then the rest
                        const selectedFirst = liAccountId
                            ? [
                                ...allLiConnections.filter(c => c.id === liAccountId),
                                ...allLiConnections.filter(c => c.id !== liAccountId)
                            ]
                            : allLiConnections;

                        if (selectedFirst.length === 0) throw new Error('No LinkedIn account connected. Go to Connections to add one.');

                        let liPostSuccess = false;
                        let lastLiError = '';

                        for (const liConn of selectedFirst) {
                            let liCreds: any = {};
                            try { liCreds = JSON.parse(liConn.credentials); } catch { }
                            const liToken = liCreds.accessToken;
                            if (!liToken) { lastLiError = 'No access token'; continue; }

                            // Test the token by getting profile
                            const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
                                headers: { 'Authorization': `Bearer ${liToken}` },
                            });
                            if (!profileRes.ok) {
                                const errData = await profileRes.json().catch(() => ({}));
                                lastLiError = errData.message || errData.error_description || 'Invalid access token';
                                continue;
                            }
                            const profileData = await profileRes.json();
                            if (!profileData.sub) { lastLiError = 'No profile ID returned'; continue; }

                            const personUrn = `urn:li:person:${profileData.sub}`;

                            let liPostBody: any;

                            if (liImageUrl) {
                                // Step 1: Register image upload with LinkedIn
                                const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${liToken}`,
                                        'X-Restli-Protocol-Version': '2.0.0',
                                    },
                                    body: JSON.stringify({
                                        registerUploadRequest: {
                                            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                                            owner: personUrn,
                                            serviceRelationships: [{
                                                relationshipType: 'OWNER',
                                                identifier: 'urn:li:userGeneratedContent',
                                            }],
                                        },
                                    }),
                                });

                                if (!registerRes.ok) {
                                    const regErr = await registerRes.json().catch(() => ({}));
                                    lastLiError = `Image register failed: ${regErr.message || JSON.stringify(regErr)}`;
                                    continue;
                                }

                                const registerData = await registerRes.json();
                                const uploadUrl = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
                                const assetUrn = registerData.value?.asset;

                                if (!uploadUrl || !assetUrn) {
                                    lastLiError = 'LinkedIn did not return upload URL';
                                    continue;
                                }

                                // Step 2: Fetch the image and upload it to LinkedIn
                                const imgFetchRes = await fetch(liImageUrl);
                                if (!imgFetchRes.ok) {
                                    lastLiError = `Could not fetch image from URL: ${liImageUrl}`;
                                    continue;
                                }
                                const imgBuffer = await imgFetchRes.arrayBuffer();

                                const uploadRes = await fetch(uploadUrl, {
                                    method: 'PUT',
                                    headers: {
                                        'Authorization': `Bearer ${liToken}`,
                                        'Content-Type': imgFetchRes.headers.get('content-type') || 'image/png',
                                    },
                                    body: imgBuffer,
                                });

                                if (!uploadRes.ok) {
                                    lastLiError = `Image upload to LinkedIn failed: ${uploadRes.status}`;
                                    continue;
                                }

                                // Step 3: Post with image
                                liPostBody = {
                                    author: personUrn,
                                    lifecycleState: 'PUBLISHED',
                                    specificContent: {
                                        'com.linkedin.ugc.ShareContent': {
                                            shareCommentary: { text: liTextContent },
                                            shareMediaCategory: 'IMAGE',
                                            media: [{
                                                status: 'READY',
                                                description: { text: liTextContent.substring(0, 200) },
                                                media: assetUrn,
                                                title: { text: 'Image' },
                                            }],
                                        },
                                    },
                                    visibility: {
                                        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
                                    },
                                };
                            } else {
                                // Text-only post
                                liPostBody = {
                                    author: personUrn,
                                    lifecycleState: 'PUBLISHED',
                                    specificContent: {
                                        'com.linkedin.ugc.ShareContent': {
                                            shareCommentary: { text: liTextContent },
                                            shareMediaCategory: 'NONE',
                                        },
                                    },
                                    visibility: {
                                        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
                                    },
                                };
                            }

                            // Post to LinkedIn
                            const liPostRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${liToken}`,
                                    'X-Restli-Protocol-Version': '2.0.0',
                                },
                                body: JSON.stringify(liPostBody),
                            });

                            if (!liPostRes.ok) {
                                const liError = await liPostRes.json().catch(() => ({}));
                                lastLiError = liError.message || JSON.stringify(liError);
                                continue;
                            }

                            const liPostData = await liPostRes.json();
                            const liPostId = liPostData.id || 'unknown';
                            output = `✅ Posted to LinkedIn${liImageUrl ? ' with image' : ''}! Post ID: ${liPostId}`;

                            await prisma.publishResult.create({
                                data: {
                                    workflowId: params.workflowId,
                                    executionId: execution.id,
                                    platform: 'linkedin',
                                    postId: liPostId,
                                    status: 'success',
                                },
                            });
                            liPostSuccess = true;
                            break;
                        }

                        if (!liPostSuccess) {
                            throw new Error(`LinkedIn posting failed: ${lastLiError}. Try disconnecting and reconnecting your LinkedIn account.`);
                        }
                        break;
                    }


                    case 'instagram-publisher': {
                        const igAccountId = node.data?.accountId;
                        if (!igAccountId) throw new Error('No Instagram account selected. Configure the node first.');

                        const igConnection = connections.find(c => c.id === igAccountId);
                        if (!igConnection) throw new Error('Instagram connection not found. Reconnect in Connections page.');

                        let igCreds: any = {};
                        try { igCreds = JSON.parse(igConnection.credentials); } catch { }
                        const igToken = igCreds.accessToken;
                        const igUserId = igCreds.username || igCreds.userId;

                        // Debug logging
                        console.log('[IG-DEBUG] Connection ID:', igAccountId);
                        console.log('[IG-DEBUG] Connection provider:', igConnection.provider);
                        console.log('[IG-DEBUG] Connection name:', igConnection.name);
                        console.log('[IG-DEBUG] Creds keys:', Object.keys(igCreds));
                        console.log('[IG-DEBUG] Token present:', !!igToken, 'length:', igToken?.length);
                        console.log('[IG-DEBUG] Token first 20 chars:', igToken?.substring(0, 20));
                        console.log('[IG-DEBUG] IG User ID:', igUserId);

                        if (!igToken) throw new Error('No access token found for this Instagram account. Disconnect and reconnect via Facebook OAuth on the Connections page.');

                        // Validate token format — a real Facebook Page Access Token is 50+ chars
                        // If the token is purely numeric and short, it's likely the IG user ID pasted by mistake
                        if (igToken.length < 50 || /^\d+$/.test(igToken)) {
                            throw new Error(
                                'Invalid Instagram access token format. The stored token appears to be an Instagram User ID, not an OAuth access token. ' +
                                'Please disconnect this Instagram account on the Connections page and reconnect via the "Connect with Facebook" button to get a proper Page Access Token.'
                            );
                        }

                        if (!igUserId) {
                            throw new Error(
                                'Missing Instagram Business Account ID. The connection is missing the Instagram user ID needed for publishing. ' +
                                'Please disconnect and reconnect via "Connect with Facebook" on the Connections page.'
                            );
                        }

                        const igContent = lastOutput || node.data?.content || '';

                        // IG needs an image. Check manual input OR previous node output.
                        const imageUrl = node.data?.imageUrl || (lastOutput && lastOutput.startsWith('http') ? lastOutput : '');

                        if (imageUrl) {
                            // Image post: Create media container then publish
                            console.log('[IG-DEBUG] Posting image to:', `https://graph.facebook.com/v19.0/${igUserId}/media`);
                            const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    image_url: imageUrl,
                                    caption: igContent,
                                    access_token: igToken,
                                }),
                            });

                            const containerData = await containerRes.json();
                            console.log('[IG-DEBUG] Container response:', JSON.stringify(containerData).substring(0, 500));
                            if (containerData.error) throw new Error(`Instagram Publisher: Instagram API: ${containerData.error.message}`);

                            const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    creation_id: containerData.id,
                                    access_token: igToken,
                                }),
                            });

                            const publishData = await publishRes.json();
                            if (publishData.error) throw new Error(`Instagram publish: ${publishData.error.message}`);

                            output = `✅ Posted to Instagram! Post ID: ${publishData.id}`;

                            await prisma.publishResult.create({
                                data: {
                                    workflowId: params.workflowId,
                                    executionId: execution.id,
                                    platform: 'instagram',
                                    postId: publishData.id,
                                    status: 'success',
                                },
                            });
                        } else {
                            // Text-only: Instagram doesn't support text-only posts
                            throw new Error('Instagram requires an image or video. Add an image URL in the node config, or use an Image Generation node before this publisher.');
                        }
                        break;
                    }


                    case 'threads-publisher': {
                        const accountId = node.data?.accountId;
                        if (!accountId) throw new Error('No Threads account selected. Configure the node first.');

                        const connection = connections.find(c => c.id === accountId);
                        if (!connection) throw new Error('Threads connection not found.');

                        let creds: any = {};
                        try { creds = JSON.parse(connection.credentials); } catch { }

                        const accessToken = creds.accessToken;
                        const userId = creds.userId || creds.username;
                        if (!accessToken || !userId) throw new Error('Threads connection requires accessToken and userId.');

                        const text = (lastOutput || node.data?.content || '').slice(0, 500);
                        if (!text) throw new Error('No content to post to Threads.');

                        const createRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                media_type: 'TEXT',
                                text,
                                access_token: accessToken,
                            }),
                        });
                        const createData = await createRes.json();
                        if (!createRes.ok || createData.error) {
                            throw new Error(`Threads API: ${createData.error?.message || 'Failed to create thread container'}`);
                        }

                        const publishRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                creation_id: createData.id,
                                access_token: accessToken,
                            }),
                        });
                        const publishData = await publishRes.json();
                        if (!publishRes.ok || publishData.error) {
                            throw new Error(`Threads publish: ${publishData.error?.message || 'Failed to publish thread'}`);
                        }

                        output = `Posted to Threads. Post ID: ${publishData.id || createData.id}`;
                        await prisma.publishResult.create({
                            data: {
                                workflowId: params.workflowId,
                                executionId: execution.id,
                                platform: 'threads',
                                postId: publishData.id || createData.id,
                                status: 'success',
                            },
                        });
                        break;
                    }

                    case 'wordpress-publisher': {
                        const accountId = node.data?.accountId;
                        if (!accountId) throw new Error('No WordPress connection selected.');
                        const connection = connections.find(c => c.id === accountId);
                        if (!connection) throw new Error('WordPress connection not found.');

                        let creds: any = {};
                        try { creds = JSON.parse(connection.credentials); } catch { }

                        const siteUrl = (node.data?.siteUrl as string) || creds.siteUrl || creds.url;
                        if (!siteUrl) throw new Error('Set WordPress site URL in node config.');

                        const title = (node.data?.title as string) || `Auto Post ${new Date().toISOString()}`;
                        const content = lastOutput || node.data?.content || '';
                        if (!content) throw new Error('No content to publish.');

                        const endpoint = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts`;
                        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                        if (creds.accessToken) headers.Authorization = `Bearer ${creds.accessToken}`;
                        if (!headers.Authorization && creds.username && creds.appPassword) {
                            headers.Authorization = `Basic ${Buffer.from(`${creds.username}:${creds.appPassword}`).toString('base64')}`;
                        }
                        if (!headers.Authorization) throw new Error('WordPress credentials missing: use accessToken or username+appPassword.');

                        const wpRes = await fetch(endpoint, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({ title, content, status: 'publish' }),
                        });
                        const wpData = await wpRes.json().catch(() => ({}));
                        if (!wpRes.ok) throw new Error(`WordPress API: ${wpData.message || wpRes.statusText}`);

                        output = `Posted to WordPress. Post ID: ${wpData.id}`;
                        await prisma.publishResult.create({
                            data: {
                                workflowId: params.workflowId,
                                executionId: execution.id,
                                platform: 'wordpress',
                                postId: String(wpData.id || ''),
                                postUrl: wpData.link || null,
                                status: 'success',
                            },
                        });
                        break;
                    }

                    case 'wix-publisher':
                    case 'squarespace-publisher': {
                        const accountId = node.data?.accountId;
                        if (!accountId) throw new Error(`No ${node.type?.split('-')[0]} connection selected.`);

                        const connection = connections.find(c => c.id === accountId);
                        if (!connection) throw new Error('Connection not found.');

                        let creds: any = {};
                        try { creds = JSON.parse(connection.credentials); } catch { }

                        const endpoint = (node.data?.siteUrl as string) || creds.endpoint || creds.siteUrl || creds.url;
                        if (!endpoint) throw new Error('Set API endpoint/site URL in node config.');

                        const accessToken = creds.accessToken;
                        if (!accessToken) throw new Error('Missing access token for this connection.');

                        const title = (node.data?.title as string) || `Auto Post ${new Date().toISOString()}`;
                        const content = lastOutput || node.data?.content || '';
                        if (!content) throw new Error('No content to publish.');

                        const platform = node.type.startsWith('wix') ? 'wix' : 'squarespace';
                        const res = await fetch(endpoint, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${accessToken}`,
                            },
                            body: JSON.stringify({
                                title,
                                content,
                                platform,
                            }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(`${platform} publish failed: ${data.message || res.statusText}`);

                        output = `Posted to ${platform === 'wix' ? 'Wix' : 'Squarespace'}.`;
                        await prisma.publishResult.create({
                            data: {
                                workflowId: params.workflowId,
                                executionId: execution.id,
                                platform,
                                postId: String(data.id || ''),
                                postUrl: data.url || null,
                                status: 'success',
                            },
                        });
                        break;
                    }

                    case 'google-sheets-publisher': {
                        const sheetId = node.data?.sheetId as string;
                        const sheetTab = node.data?.sheetTab as string;
                        const contentCol = (node.data?.contentColumn as string || 'A').toUpperCase();
                        const imageCol = (node.data?.imageColumn as string || '').toUpperCase();

                        if (!sheetId) throw new Error('Spreadsheet ID is required.');
                        if (!sheetTab) throw new Error('Sheet Tab name is required.');

                        const user = await prisma.user.findUnique({
                            where: { id: session.user.id },
                            select: { googleApiKey: true }
                        });

                        if (!user?.googleApiKey) throw new Error('Google API Key not found. Please configure it in Settings.');

                        // Note: Writing to sheets usually requires OAuth access token with 'https://www.googleapis.com/auth/spreadsheets' scope.
                        // Using API Key only works if the sheet is publicly editable (unlikely) or if we use a different auth method.
                        // For now, we'll try to use the API Key, but if it fails, we might need to prompt for OAuth.
                        // Ideally checking for a Google Account connection would be better, but let's stick to the requested quick implementation.

                        // Actually, 'sheets.spreadsheets.values.append' requires OAuth 2.0. API Key is not sufficient for writing private user data.
                        // However, since the user asked to "make write work", and we have a `google-sheets` generic integration...
                        // If they are using a Service Account or similar, we might need that.
                        // For this iteration, I'll attempt using the API Key (which might fail for private sheets) 
                        // AND check if there's a connected Google account to use its token.

                        const googleConnection = connections.find(c => c.provider === 'google');
                        let accessToken = '';

                        if (googleConnection) {
                            try {
                                const creds = JSON.parse(googleConnection.credentials);
                                accessToken = creds.accessToken;
                            } catch (e) {
                                console.error("Failed to parse Google creds", e);
                            }
                        }

                        // If no OAuth token, we can't write to private sheets.
                        if (!accessToken && !user?.googleApiKey) {
                            throw new Error('No Google connection or API Key found. Connect Google in Settings or Connections.');
                        }

                        const content = lastTextOutput || lastOutput || node.data?.content || '';
                        const imageUrl = lastImageUrl || node.data?.imageUrl || '';

                        const values = [];
                        // Construct the row based on columns. We need to map columns A, B, C to indices 0, 1, 2.
                        // Simplified approach: Create a row array large enough.
                        const colToIndex = (col: string) => {
                            let sum = 0;
                            for (let i = 0; i < col.length; i++) {
                                sum *= 26;
                                sum += (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
                            }
                            return sum - 1;
                        };

                        const rowData: string[] = [];
                        if (content && contentCol) {
                            const idx = colToIndex(contentCol);
                            rowData[idx] = content;
                        }
                        if (imageUrl && imageCol) {
                            const idx = colToIndex(imageCol);
                            rowData[idx] = imageUrl;
                        }

                        // Fill gaps with empty strings
                        for (let i = 0; i < rowData.length; i++) {
                            if (rowData[i] === undefined) rowData[i] = '';
                        }

                        // Use append endpoint
                        const range = `${sheetTab}!A1`;
                        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED&key=${user?.googleApiKey}`;

                        const headers: any = { 'Content-Type': 'application/json' };
                        if (accessToken) {
                            headers['Authorization'] = `Bearer ${accessToken}`;
                        }

                        const res = await fetch(url, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({
                                range,
                                majorDimension: 'ROWS',
                                values: [rowData],
                            }),
                        });

                        const data = await res.json();
                        if (!res.ok) {
                            throw new Error(`Google Sheets API Error: ${data.error?.message || res.statusText}`);
                        }

                        output = `Successfully appended row to ${sheetTab}. Updated range: ${data.updates?.updatedRange}`;
                        // We don't necessarily need to store a PublishResult for this unless we treat it as a publication.
                        // But let's log it as a success outcome.
                        break;
                    }

                    default:
                        output = `Node "${node.type}" executed.`;
                }

                lastOutput = output;

                // Track text and image outputs separately
                if (node.type === 'image-generation') {
                    // Image node: output is a URL — store as image, keep existing text
                    if (output && (output.startsWith('http') || output.startsWith('data:'))) {
                        lastImageUrl = output;
                    }
                } else if (node.type?.includes('publisher')) {
                    // Publishers don't feed downstream, don't update tracking
                } else {
                    // All other nodes produce text content
                    if (output) lastTextOutput = output;
                }

                results[node.id] = { status: 'completed', output };

                await prisma.executionStep.update({
                    where: { id: step.id },
                    data: { status: "completed", output, completedAt: new Date() },
                });

            } catch (error: any) {
                results[node.id] = { status: 'failed', error: error.message };
                await prisma.executionStep.update({
                    where: { id: step.id },
                    data: { status: "failed", error: error.message, completedAt: new Date() },
                });
            }
        }

        // Mark execution complete
        const hasFailures = Object.values(results).some((r: any) => r.status === 'failed');
        await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: {
                status: hasFailures ? "failed" : "completed",
                completedAt: new Date(),
                logs: JSON.stringify(results),
            },
        });

        return NextResponse.json({
            success: true,
            executionId: execution.id,
            status: hasFailures ? "failed" : "completed",
            results,
        });

    } catch (error: any) {
        console.error("Workflow execution error:", error);
        return NextResponse.json({ error: error.message || "Execution failed" }, { status: 500 });
    }
}

// Helper: Extract Spreadsheet ID from URL
function normalizeSpreadsheetId(sheetId: string) {
    if (sheetId.includes('/d/')) {
        const parts = sheetId.split('/d/');
        if (parts.length > 1) {
            return parts[1].split('/')[0];
        }
    }
    return sheetId;
}

// Helper: Get row number from range string to know exactly which row we are editing
function parseStartRowFromRange(rangeOpt: string | undefined): number {
    if (!rangeOpt) return 1;
    // range could be "Sheet1!A1:B10" or just "A1:B10" or "Sheet1"
    const parts = rangeOpt.split('!');
    const rangeStr = parts[parts.length - 1]; // "A1:B10"
    const firstCell = rangeStr.split(':')[0]; // "A1"
    const rowMatch = firstCell.match(/\d+/);
    if (rowMatch && rowMatch[0]) {
        return parseInt(rowMatch[0], 10);
    }
    return 1;
}

// Helper: Get OAuth 2.0 access token to write to Google Sheets
async function getGoogleWriteAccessToken(userId: string, forceRefresh = false): Promise<string | null> {
    try {
        const connections = await prisma.externalConnection.findMany({
            where: { userId, provider: 'google' },
            orderBy: { updatedAt: 'desc' },
        });
        if (!connections.length) return null;

        // Prefer a connection that has refreshToken; fallback to newest record.
        let connection = connections[0];
        for (const c of connections) {
            const parsed = JSON.parse(c.credentials || '{}');
            if (parsed.refreshToken) {
                connection = c;
                break;
            }
        }

        const creds = JSON.parse(connection.credentials || '{}');
        const now = Date.now();
        const expiresAt = typeof creds.expiresAt === 'number' ? creds.expiresAt : 0;

        // Use current token only when we know it is still valid (with 60s buffer)
        if (!forceRefresh && creds.accessToken && expiresAt && expiresAt > (now + 60_000)) {
            return creds.accessToken;
        }

        // Attempt refresh when refresh token + client credentials are available
        const refreshToken = creds.refreshToken;
        const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_SHEETS_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SHEETS_CLIENT_SECRET;
        if (refreshToken && clientId && clientSecret) {
            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                }),
            });

            const tokenData = await tokenRes.json().catch(() => ({}));
            if (tokenRes.ok && tokenData.access_token) {
                const nextCreds = {
                    ...creds,
                    accessToken: tokenData.access_token,
                    expiresAt: now + ((tokenData.expires_in || 3600) * 1000),
                };
                await prisma.externalConnection.update({
                    where: { id: connection.id },
                    data: { credentials: JSON.stringify(nextCreds) },
                });
                return nextCreds.accessToken;
            }
            console.error('Google token refresh failed:', tokenData);
        }

        // Last-resort fallback if no refresh path is available.
        return creds.accessToken || null;
    } catch (e) {
        console.error("Failed to fetch Google OAuth token:", e);
        return null;
    }
}
