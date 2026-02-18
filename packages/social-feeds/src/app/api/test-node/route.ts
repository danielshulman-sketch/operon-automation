import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { nodeType, masterPrompt, taskPrompt, provider } = body;

        if (nodeType === 'ai-generation') {
            const { contentSource, rssUrl, sheetId, sheetTab, sheetColumn } = body;

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
                // Try to use Google Sheets API if API key exists
                const userWithKey = await prisma.user.findUnique({ where: { id: session.user.id }, select: { googleApiKey: true } });
                if (userWithKey?.googleApiKey && sheetId) {
                    try {
                        const range = `${sheetTab || 'Sheet1'}!${sheetColumn || 'A'}1:${sheetColumn || 'A'}5`;
                        const sheetsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${userWithKey.googleApiKey}`);
                        if (sheetsRes.ok) {
                            const sheetData = await sheetsRes.json();
                            const rows = sheetData.values || [];
                            inputContent = rows.flat().filter(Boolean).join('\n');
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
                // For testing, we might not have 'upstream' content, so we use dummy text if not provided
                inputContent = "This is sample upstream content for testing purposes.";
            }

            let fullPrompt = taskPrompt || 'Generate a social media post.';
            const persona = masterPrompt || 'You are a helpful social media assistant.';

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
                where: { id: session.user.id },
                select: { openaiApiKey: true },
            });

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
                const errorData = await response.json();
                return NextResponse.json({
                    success: false,
                    error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`,
                }, { status: 500 });
            }

            const data = await response.json();
            const generatedText = data.choices[0]?.message?.content || 'No content generated.';

            return NextResponse.json({
                success: true,
                result: generatedText,
                provider: provider || 'openai',
                tokensUsed: data.usage?.total_tokens || 0,
            });
        }



        if (nodeType === 'blog-creation') {
            const { contentSource, rssUrl, sheetId, sheetTab, sheetColumn } = body;
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
            } else if (contentSource === 'google-sheets') {
                const userWithKey = await prisma.user.findUnique({ where: { id: session.user.id }, select: { googleApiKey: true } });
                if (userWithKey?.googleApiKey && sheetId) {
                    try {
                        const range = `${sheetTab || 'Sheet1'}!${sheetColumn || 'A'}1:${sheetColumn || 'A'}5`;
                        const sheetsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${userWithKey.googleApiKey}`);
                        if (sheetsRes.ok) {
                            const sheetData = await sheetsRes.json();
                            const rows = sheetData.values || [];
                            sourceText = rows.flat().filter(Boolean).join('\n');
                        }
                    } catch (e) {
                        sourceText = `Error fetching Sheet: ${e}`;
                    }
                } else {
                    sourceText = "Google Sheets source requires a Google API Key.";
                }
            } else {
                sourceText = "Sample upstream content for blog generation testing.";
            }

            const blogPrompt = (body.blogPrompt as string) || 'Write a blog post.';
            const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { openaiApiKey: true } });

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
                const errorData = await response.json();
                return NextResponse.json({ success: false, error: errorData.error?.message }, { status: 500 });
            }

            const data = await response.json();
            return NextResponse.json({ success: true, result: data.choices[0]?.message?.content });
        }

        if (nodeType === 'image-generation') {
            const provider = body.provider || 'dalle-3';
            // Use the explicit image prompt from the test UI, or default. Do NOT use taskPrompt as it's for text generation.
            let prompt = (body.prompt as string)?.trim() || 'A creative image.';

            console.log('[Test Node] Image Generation Request:', { provider, prompt, promptLength: prompt.length });

            if (provider === 'dalle-3') {
                const user = await prisma.user.findUnique({
                    where: { id: session.user.id },
                    select: { openaiApiKey: true },
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
                    const err = await response.json();
                    return NextResponse.json({ success: false, error: `DALL-E 3 error: ${err.error?.message || 'Unknown'}` }, { status: 500 });
                }

                const data = await response.json();
                const imageUrl = data.data[0]?.url || '';
                return NextResponse.json({ success: true, result: imageUrl });

            } else if (provider === 'nano-banana' || provider === 'gemini') {
                const user = await prisma.user.findUnique({
                    where: { id: session.user.id },
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
