const fs = require('fs');
const filePath = 'c:\\Users\\danie\\OneDrive\\Documents\\app  builds\\New folder\\packages\\social-feeds\\src\\app\\api\\workflows\\[workflowId]\\execute\\route.ts';
let code = fs.readFileSync(filePath, 'utf8');

const targetStr = \const enhancedPersona = persona + humanInstructions + socialContext;

                        const response = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',\;

const replacementStr = \const enhancedPersona = persona + humanInstructions + socialContext;

                        let userAiConfig = { openrouterKey: '', openrouterModel: '' };
                        if (user?.aiConfig) {
                            try {
                                userAiConfig = typeof user.aiConfig === 'string' ? JSON.parse(user.aiConfig) : user.aiConfig;
                            } catch (e) {
                                console.error('Error parsing user aiConfig:', e);
                            }
                        }

                        if (userAiConfig.openrouterKey) {
                            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': \\\Bearer \\\\\\,
                                    'HTTP-Referer': 'https://social-feeds.com',
                                    'X-Title': 'Social Feeds Poster',
                                },
                                body: JSON.stringify({
                                    model: userAiConfig.openrouterModel || 'openrouter/auto',
                                    messages: [
                                        { role: 'system', content: enhancedPersona },
                                        { role: 'user', content: taskPrompt },
                                    ],
                                }),
                            });

                            if (!response.ok) {
                                const errorData = await response.json().catch(() => ({}));
                                throw new Error(\\\OpenRouter error: \\\\\\);
                            }

                            const aiData = await response.json();
                            output = aiData.choices[0]?.message?.content || 'No content generated.';
                            break;
                        }

                        const response = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',\;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Successfully replaced AI generation block');
} else {
    console.log('Target string not found in AI generation block. Might use a different endline encoding (CRLF vs LF)');
    
    // Fallback: replace using a regex that ignores line endings
    const fallbackRegex = /const enhancedPersona = persona \+ humanInstructions \+ socialContext;[\s\S]*?const response = await fetch\('https:\/\/api\.openai\.com\/v1\/chat\/completions', \{[\s\S]*?method: 'POST',/;
    
    const fallbackReplacement = \const enhancedPersona = persona + humanInstructions + socialContext;

                        let userAiConfig: any = {};
                        if (user?.aiConfig) {
                            try {
                                userAiConfig = typeof user.aiConfig === 'string' ? JSON.parse(user.aiConfig) : user.aiConfig;
                            } catch (e) { }
                        }

                        if (userAiConfig.openrouterKey) {
                            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': \\\Bearer \\\\\\,
                                    'HTTP-Referer': 'https://social-feeds.com',
                                    'X-Title': 'Social Feeds Poster',
                                },
                                body: JSON.stringify({
                                    model: userAiConfig.openrouterModel || 'openrouter/auto',
                                    messages: [
                                        { role: 'system', content: enhancedPersona },
                                        { role: 'user', content: taskPrompt },
                                    ],
                                }),
                            });

                            if (!response.ok) {
                                const errorData = await response.json().catch(() => ({}));
                                throw new Error(\\\OpenRouter error: \\\\\\);
                            }

                            const aiData = await response.json();
                            output = aiData.choices[0]?.message?.content || 'No content generated.';
                            break;
                        }

                        const response = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',\;
                            
    if (fallbackRegex.test(code)) {
        code = code.replace(fallbackRegex, fallbackReplacement);
        fs.writeFileSync(filePath, code, 'utf8');
        console.log('Successfully replaced AI generation block using regex fallback');
    } else {
        console.error('Failed to find target block entirely. Exiting.');
        process.exit(1);
    }
}
