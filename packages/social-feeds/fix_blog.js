const fs = require('fs');
const filePath = 'c:\\Users\\danie\\OneDrive\\Documents\\app  builds\\New folder\\packages\\social-feeds\\src\\app\\api\\workflows\\[workflowId]\\execute\\route.ts';
let code = fs.readFileSync(filePath, 'utf8');

const targetStr = \const blogPrompt = node.data?.blogPrompt || 'Write a polished blog post with headline, sections, and conclusion.';

                        if (user?.openaiApiKey) {
                            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                                method: 'POST',\;

const replacementStr = \const blogPrompt = node.data?.blogPrompt || 'Write a polished blog post with headline, sections, and conclusion.';

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
                                        { role: 'system', content: 'You are a professional blog writer.' },
                                        { role: 'user', content: \\\\\\\\\\n\\\\nSource material:\\\\n\\\\\\ },
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

                        if (user?.openaiApiKey) {
                            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                                method: 'POST',\;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Successfully replaced blog creation block');
} else {
    console.log('Target string not found, falling back to regex');
    const fallbackRegex = /const blogPrompt = node\.data\?\.blogPrompt \|\| 'Write a polished blog post with headline, sections, and conclusion\.';[\s\S]*?if \(user\?\.openaiApiKey\) \{[\s\S]*?const response = await fetch\('https:\/\/api\.openai\.com\/v1\/chat\/completions', \{[\s\S]*?method: 'POST',/;

    if (fallbackRegex.test(code)) {
        code = code.replace(fallbackRegex, replacementStr);
        fs.writeFileSync(filePath, code, 'utf8');
        console.log('Successfully replaced blog creation block using regex fallback');
    } else {
        console.error('Failed to find blog creation block entirely. Exiting.');
        process.exit(1);
    }
}
