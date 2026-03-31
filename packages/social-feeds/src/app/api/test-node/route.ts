import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiAuthContext, unauthorizedJson } from "@/lib/apiAuth";
import { publishBlogToEasyAi, type PublishBlogPayload } from "@/lib/publishBlog";
import {
    applyHttpTemplate,
    buildEasyAiPostBlogBody,
    buildWorkflowHttpTemplateContext,
    getWorkflowInternalSecret,
    isInternalHttpRequest,
    isPublishBlogRequest,
    resolvePublishBlogRequestUrl,
    validateHttpRequestTarget,
} from "@/lib/httpRequest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const normalizeEnv = (value?: string) =>
    (value || "").trim().replace(/^["']|["']$/g, "");

const getString = (value: unknown, fallback = "") =>
    typeof value === "string" ? value : fallback;

const normalizeSpreadsheetId = (value: unknown) => {
    const trimmed = getString(value).trim();
    if (!trimmed) return "";

    const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match?.[1] || trimmed;
};

async function parseJsonResponse<T = any>(response: Response): Promise<T | null> {
    const text = await response.text().catch(() => "");
    if (!text) return null;

    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}

async function getUpstreamErrorMessage(response: Response, fallback: string): Promise<string> {
    const text = await response.text().catch(() => "");
    if (!text) return fallback;

    try {
        const parsed = JSON.parse(text) as any;
        return parsed?.error?.message || parsed?.message || text || fallback;
    } catch {
        return text;
    }
}

async function buildUpstreamErrorResponse(response: Response, prefix: string, fallback = "Unknown error") {
    const message = await getUpstreamErrorMessage(response, fallback);
    const status = response.status >= 400 && response.status < 600 ? response.status : 502;

    return NextResponse.json({
        success: false,
        error: `${prefix}: ${message}`,
    }, { status });
}

const stringifyHttpResponse = (value: unknown) =>
    typeof value === "string" ? value : JSON.stringify(value, null, 2);

const summarizeHttpError = (status: number, statusText: string, responseText: string) => {
    const statusLabel = statusText ? ` ${statusText}` : "";
    const trimmed = responseText.trim();
    if (!trimmed) {
        return `HTTP Request failed: ${status}${statusLabel}`;
    }

    try {
        const parsed = JSON.parse(trimmed) as {
            error?: string | { message?: string };
            message?: string;
            details?: string;
        };
        const message =
            (typeof parsed.error === "string" ? parsed.error : parsed.error?.message) ||
            parsed.message ||
            parsed.details;

        if (message) {
            return `HTTP Request failed: ${status}${statusLabel} - ${message}`;
        }
    } catch {
        // Fall back to the raw response below.
    }

    return `HTTP Request failed: ${status}${statusLabel} - ${trimmed.slice(0, 300)}`;
};

async function getGoogleAccessToken(userId: string, forceRefresh = false): Promise<string | null> {
    try {
        const connections = await prisma.externalConnection.findMany({
            where: { userId, provider: 'google' },
            orderBy: { updatedAt: 'desc' },
        });
        if (!connections.length) return null;

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

        if (!forceRefresh && creds.accessToken && expiresAt && expiresAt > (now + 60_000)) {
            return creds.accessToken;
        }

        const refreshToken = creds.refreshToken;
        const clientId = normalizeEnv(process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_SHEETS_CLIENT_ID);
        const clientSecret = normalizeEnv(process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SHEETS_CLIENT_SECRET);
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
        }

        return creds.accessToken || null;
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const auth = await getApiAuthContext(req);
        if (!auth?.userId) return unauthorizedJson();

        const body = await req.json();
        const { nodeType, masterPrompt, taskPrompt, provider } = body;

        if (nodeType === 'ai-generation') {
            const { contentSource, rssUrl, sheetTab, sheetColumn } = body;
            const sheetId = normalizeSpreadsheetId(body.sheetId);

            // 1. Determine Input Content
            let inputContent = '';

            if (contentSource === 'rss') {
                const url = (rssUrl as string || '').trim();
                if (url) {
                    try {
                        const rssRes = await fetch(url.startsWith('http') ? url : `https://news.google.com/rss/search?q=${encodeURIComponent(url)}`, {
                            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SocialPosterBot/1.0)' },
                        });
                        if (rssRes.ok) {
                            const rssXml = await rssRes.text();
                            // Simple regex extraction for test node (reusing logic would be better but keeping it self-contained for now)
                            const itemMatch = rssXml.match(/<item>([\s\S]*?)<\/item>/i);
                            if (itemMatch) {
                                const title = itemMatch[1].match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '';
                                const link = itemMatch[1].match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '';
                                const desc = itemMatch[1].match(/<description>([\s\S]*?)<\/description>/i)?.[1] || '';
                                inputContent = `Title: ${title}\nLink: ${link}\nDescription: ${desc}`;
                            } else {
                                inputContent = "RSS Feed found but no items detected.";
                            }
                        }
                    } catch (e) {
                        inputContent = `Error fetching RSS: ${url}`;
                    }
                }
            } else if (contentSource === 'google-sheets') {
                // Prefer OAuth token; fallback to API key if provided
                const userWithKey = await prisma.user.findUnique({ where: { id: auth.userId }, select: { googleApiKey: true } });
                const readToken = await getGoogleAccessToken(auth.userId);
                if ((readToken || userWithKey?.googleApiKey) && sheetId) {
                    try {
                        const range = `${sheetTab || 'Sheet1'}!${sheetColumn || 'A'}1:${sheetColumn || 'A'}1000`;
                        let fetchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
                        const readHeaders: Record<string, string> = {};
                        if (readToken) {
                            readHeaders.Authorization = `Bearer ${readToken}`;
                        } else {
                            fetchUrl += `?key=${userWithKey?.googleApiKey}`;
                        }
                        const sheetsRes = await fetch(fetchUrl, { headers: readHeaders });
                        if (sheetsRes.ok) {
                            const sheetData = await sheetsRes.json();
                            const rows: string[][] = sheetData.values || [];
                            let usedRowIndex = -1;
                            for (let i = 0; i < rows.length; i++) {
                                const titleCell = (rows[i]?.[0] || '').trim();
                                const doneCell = (rows[i]?.[1] || '').trim().toLowerCase();
                                if (titleCell && doneCell !== 'done') {
                                    inputContent = titleCell;
                                    usedRowIndex = i;
                                    break;
                                }
                            }

                            if (usedRowIndex === -1) {
                                inputContent = 'All rows in the sheet have been processed (marked as done).';
                            } else {
                                const statusCol = String.fromCharCode(((sheetColumn || 'A').toUpperCase().charCodeAt(0) + 1 > 90) ? 90 : (sheetColumn || 'A').toUpperCase().charCodeAt(0) + 1);
                                const actualRow = usedRowIndex + 1;
                                const markRange = `${sheetTab || 'Sheet1'}!${statusCol}${actualRow}`;
                                let writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(markRange)}?valueInputOption=USER_ENTERED`;
                                const writeHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
                                if (readToken) {
                                    writeHeaders.Authorization = `Bearer ${readToken}`;
                                } else {
                                    writeUrl += `&key=${userWithKey?.googleApiKey}`;
                                }
                                await fetch(writeUrl, {
                                    method: 'PUT',
                                    headers: writeHeaders,
                                    body: JSON.stringify({ values: [['done']] }),
                                });
                            }
                        } else {
                            inputContent = `Error fetching Sheet: ${sheetsRes.statusText}`;
                        }
                    } catch (e) {
                        inputContent = `Error fetching Sheet: ${e}`;
                    }
                } else {
                    inputContent = "Google Sheets source requires a Google OAuth connection or Google API Key in Settings and a valid Spreadsheet ID.";
                }
            } else {
                // For testing, we might not have 'upstream' content, so we use dummy text if not provided
                inputContent = "This is sample upstream content for testing purposes.";
            }

            let fullPrompt = getString(taskPrompt, 'Generate a social media post.');
            const persona = getString(masterPrompt, 'You are a helpful social media assistant.');

            if (fullPrompt.includes('{{content}}')) {
                fullPrompt = fullPrompt.replace('{{content}}', inputContent);
            } else if (inputContent) {
                fullPrompt = fullPrompt + '\n\nSource material to work with:\n' + inputContent;
            }

            // HUMAN-LIKE PROMPT ENGINEERING (Matching execute logic)
            const humanInstructions = `\n\nCRITICAL STYLE INSTRUCTIONS:
- Write like a real human, not an AI. Use conversational, natural language.
- AVOID these words/phrases: "unlock", "elevate", "game-changer", "dive in", "landscape", "testament", "tapestry", "bustling", "mastering".
- Do not use robotic transitions like "In conclusion" or "Moreover".
- Use varied sentence structure. Be punchy.
- Show personality and authenticity.`;

            const enhancedPersona = persona + humanInstructions;

            // Get the user's API key from the database
            const user = await prisma.user.findUnique({
                where: { id: auth.userId },
                select: { openaiApiKey: true, openrouterApiKey: true },
            });

            if (provider === 'openrouter') {
                if (!user?.openrouterApiKey) {
                    return NextResponse.json({
                        success: false,
                        error: 'No OpenRouter API key configured. Go to Settings to add your API key.',
                    }, { status: 400 });
                }

                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.openrouterApiKey}`,
                        'HTTP-Referer': 'https://social-feeds.com',
                        'X-Title': 'Social Feeds Poster',
                    },
                    body: JSON.stringify({
                        model: body.model || 'openrouter/auto',
                        messages: [
                            { role: 'system', content: enhancedPersona },
                            { role: 'user', content: fullPrompt },
                        ],
                    }),
                });

                if (!response.ok) {
                    return buildUpstreamErrorResponse(response, "OpenRouter API error");
                }

                const data = await parseJsonResponse(response);
                const generatedText = data?.choices?.[0]?.message?.content || 'No content generated.';

                return NextResponse.json({
                    success: true,
                    result: generatedText,
                    provider: 'openrouter',
                    tokensUsed: data.usage?.total_tokens || 0,
                });
            }

            const openaiKey = user?.openaiApiKey;

            if (!openaiKey) {
                return NextResponse.json({
                    success: false,
                    error: 'No OpenAI API key configured. Go to Settings to add your API key.',
                }, { status: 400 });
            }

            // Real AI call
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: enhancedPersona },
                        { role: 'user', content: fullPrompt },
                    ],
                    max_tokens: 500,
                }),
            });

            if (!response.ok) {
                return buildUpstreamErrorResponse(response, "OpenAI API error");
            }

            const data = await parseJsonResponse(response);
            const generatedText = data?.choices?.[0]?.message?.content || 'No content generated.';

            return NextResponse.json({
                success: true,
                result: generatedText,
                provider: provider || 'openai',
                tokensUsed: data.usage?.total_tokens || 0,
            });
        }



        if (nodeType === 'blog-creation') {
            const { contentSource: rawContentSource, rssUrl } = body;
            const contentSource = rawContentSource === 'google-sheets' ? 'upstream' : rawContentSource;
            let sourceText = '';

            if (contentSource === 'rss') {
                const url = (rssUrl as string || '').trim();
                if (url) {
                    try {
                        const rssRes = await fetch(url.startsWith('http') ? url : `https://news.google.com/rss/search?q=${encodeURIComponent(url)}`, {
                            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SocialPosterBot/1.0)' },
                        });
                        if (rssRes.ok) {
                            const rssXml = await rssRes.text();
                            const itemMatch = rssXml.match(/<item>([\s\S]*?)<\/item>/i);
                            if (itemMatch) {
                                const title = itemMatch[1].match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '';
                                const link = itemMatch[1].match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '';
                                const desc = itemMatch[1].match(/<description>([\s\S]*?)<\/description>/i)?.[1] || '';
                                sourceText = `Title: ${title}\nLink: ${link}\nDescription: ${desc}`;
                            }
                        }
                    } catch (e) {
                        sourceText = `Error fetching RSS: ${url}`;
                    }
                }
            } else {
                sourceText = "Sample upstream content for blog generation testing.";
            }

            const blogPrompt = getString(body.blogPrompt, 'Write a blog post.');
            const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { openaiApiKey: true } });

            if (!user?.openaiApiKey) {
                return NextResponse.json({ success: false, error: 'No OpenAI API key.' }, { status: 400 });
            }

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
                    max_tokens: 800,
                }),
            });

            if (!response.ok) {
                return buildUpstreamErrorResponse(response, "OpenAI API error");
            }

            const data = await parseJsonResponse(response);
            return NextResponse.json({ success: true, result: data?.choices?.[0]?.message?.content || 'No content generated.' });
        }

        if (nodeType === 'http-request') {
            const rawUrl = getString(body.url).trim();
            const targetError = validateHttpRequestTarget(rawUrl, req.url);
            if (targetError) {
                return NextResponse.json({ success: false, error: targetError }, { status: 400 });
            }

            const method = getString(body.method, 'POST').toUpperCase();
            const contentType = getString(body.contentType, 'application/json');
            const bearerToken = getString(body.bearerToken).trim();
            const customHeaders: { key: string; value: string }[] = Array.isArray(body.headers) ? body.headers : [];

            const isDirectBlogPublishTarget = isPublishBlogRequest(rawUrl);
            const upstreamText =
                getString(body.testInput) ||
                getString(body.taskPrompt) ||
                getString(body.masterPrompt) ||
                (isDirectBlogPublishTarget ? "<h1>Test Post</h1><p>This is a test blog post generated from the HTTP node test path.</p>" : "");
            const templateContext = buildWorkflowHttpTemplateContext({
                upstreamText,
                workflowId: getString(body.workflowId, 'test-workflow'),
                executionId: 'test-execution',
                userId: auth.userId,
            });
            const url = applyHttpTemplate(
                resolvePublishBlogRequestUrl(rawUrl, req.url),
                templateContext
            );
            const isPublishBlogTarget = isPublishBlogRequest(rawUrl) || isPublishBlogRequest(url);

            const reqHeaders: Record<string, string> = {};
            if (method !== 'GET') {
                reqHeaders['Content-Type'] = contentType;
            }
            if (bearerToken) {
                reqHeaders['Authorization'] = `Bearer ${applyHttpTemplate(bearerToken, templateContext)}`;
            }
            for (const header of customHeaders) {
                if (header?.key && header?.value) {
                    reqHeaders[applyHttpTemplate(header.key, templateContext)] = applyHttpTemplate(header.value, templateContext);
                }
            }

            if (isInternalHttpRequest(url, req.url)) {
                const internalSecret = getWorkflowInternalSecret();
                if (internalSecret) {
                    reqHeaders['x-workflow-secret'] = internalSecret;
                    reqHeaders['x-workflow-user-id'] = auth.userId;
                    reqHeaders['x-workflow-id'] = getString(body.workflowId, 'test-workflow');
                    reqHeaders['x-workflow-execution-id'] = 'test-execution';
                }
            }

            let bodyString: string | undefined;
            if (method !== 'GET') {
                let bodyTemplate = getString(body.body).trim();
                if (bodyTemplate) {
                    bodyTemplate = applyHttpTemplate(bodyTemplate, templateContext);
                    if (contentType === 'application/json' && isPublishBlogTarget) {
                        try {
                            JSON.parse(bodyTemplate);
                        } catch {
                            bodyTemplate = buildEasyAiPostBlogBody(templateContext);
                        }
                    }
                } else if (upstreamText) {
                    if (contentType === 'application/json' && isPublishBlogTarget) {
                        bodyTemplate = buildEasyAiPostBlogBody(templateContext);
                    } else if (contentType === 'application/json') {
                        bodyTemplate = JSON.stringify({ content: upstreamText });
                    } else if (contentType === 'application/x-www-form-urlencoded') {
                        bodyTemplate = `content=${encodeURIComponent(upstreamText)}`;
                    } else {
                        bodyTemplate = upstreamText;
                    }
                }
                bodyString = bodyTemplate || undefined;
            }

            if (isPublishBlogTarget) {
                let publishPayload: PublishBlogPayload = {};
                if (bodyString) {
                    try {
                        publishPayload = JSON.parse(bodyString);
                    } catch {
                        return NextResponse.json({
                            success: false,
                            error: 'HTTP Request node: Publish Blog body must be valid JSON.',
                        }, { status: 400 });
                    }
                }

                const publishResult = await publishBlogToEasyAi(publishPayload);
                const responseText = stringifyHttpResponse(publishResult.data);

                if (publishResult.status < 200 || publishResult.status >= 300) {
                    return NextResponse.json({
                        success: false,
                        error: summarizeHttpError(publishResult.status, "", responseText),
                    }, { status: publishResult.status });
                }

                return NextResponse.json({
                    success: true,
                    result: `HTTP ${method} ${url} -> ${publishResult.status}\n${responseText}`,
                });
            }

            const response = await fetch(url, {
                method,
                headers: reqHeaders,
                ...(bodyString !== undefined ? { body: bodyString } : {}),
            });

            const responseText = await response.text();
            if (!response.ok) {
                return NextResponse.json({
                    success: false,
                    error: summarizeHttpError(response.status, response.statusText, responseText),
                }, { status: response.status });
            }

            let responseOutput = responseText;
            try {
                responseOutput = JSON.stringify(JSON.parse(responseText), null, 2);
            } catch {
                // Keep raw text when the upstream response is not JSON.
            }

            return NextResponse.json({
                success: true,
                result: `HTTP ${method} ${url} -> ${response.status}\n${responseOutput}`,
            });
        }

        if (nodeType === 'image-generation') {
            const provider = body.provider || 'dalle-3';
            // Use the explicit image prompt from the test UI, or default. Do NOT use taskPrompt as it's for text generation.
            let prompt = getString(body.prompt, 'A creative image.').trim() || 'A creative image.';

            console.log('[Test Node] Image Generation Request:', { provider, prompt, promptLength: prompt.length });

            if (provider === 'dalle-3') {
                const user = await prisma.user.findUnique({
                    where: { id: auth.userId },
                    select: { openaiApiKey: true, openrouterApiKey: true },
                });
                // @ts-ignore
                if (!user?.openaiApiKey) {
                    return NextResponse.json({ success: false, error: 'No OpenAI API key configured.' }, { status: 400 });
                }

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
                    return buildUpstreamErrorResponse(response, "DALL-E 3 error");
                }

                const data = await parseJsonResponse(response);
                const imageUrl = data?.data?.[0]?.url || '';
                return NextResponse.json({ success: true, result: imageUrl });

            } else if (provider === 'nano-banana' || provider === 'gemini') {
                const user = await prisma.user.findUnique({
                    where: { id: auth.userId },
                    select: { googleApiKey: true } // This field exists now
                });

                // @ts-ignore
                if (!user?.googleApiKey) {
                    return NextResponse.json({ success: false, error: 'No Google API key configured for Nano Banana.' }, { status: 400 });
                }

                // Nano Banana (Gemini/Imagen)
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${user.googleApiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        instances: [{ prompt: prompt }],
                        parameters: { sampleCount: 1 }
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    return NextResponse.json({ success: false, error: `Nano Banana error: ${errText}` }, { status: 500 });
                }

                const data = await response.json();
                const b64 = data.predictions?.[0]?.bytesBase64Encoded;

                if (!b64) return NextResponse.json({ success: false, error: 'Nano Banana returned no image data.' }, { status: 500 });

                return NextResponse.json({ success: true, result: `data:image/png;base64,${b64}` });
            }

            return NextResponse.json({
                success: false,
                error: `Unknown image provider: ${provider}`,
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            result: `Node type "${nodeType}" test completed.`,
        });
    } catch (error: any) {
        console.error('Test node error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Test execution failed',
        }, { status: 500 });
    }
}
