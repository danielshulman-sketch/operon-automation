const fs = require('fs');
const filePath = 'c:\\Users\\danie\\OneDrive\\Documents\\app  builds\\New folder\\packages\\social-feeds\\src\\app\\api\\workflows\\[workflowId]\\execute\\route.ts';

try {
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex string for ai-generation that tolerates whitespace differences
  const aiGenSearch = /const enhancedPersona = persona \+ humanInstructions \+ socialContext;\s*const response = await fetch\('https:\/\/api\.openai\.com\/v1\/chat\/completions',\s*\{\s*method: 'POST',/g;

  const aiGenReplace = \const enhancedPersona = persona + humanInstructions + socialContext;

                        let userAiConfig: any = {};
                        if (user?.aiConfig) {
                            try {
                                userAiConfig = typeof user.aiConfig === 'string' ? JSON.parse(user.aiConfig) : user.aiConfig;
                            } catch (e) {
                                console.error('Error parsing user aiConfig in ai-generation:', e);
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

  // Regex string for blog-creation that tolerates whitespace differences
  const blogSearch = /const blogPrompt = node\.data\?\.blogPrompt \|\| 'Write a polished blog post with headline, sections, and conclusion\.';\s*if \(user\?\.openaiApiKey\)\s*\{\s*const response = await fetch\('https:\/\/api\.openai\.com\/v1\/chat\/completions',\s*\{\s*method: 'POST',/g;

  const blogReplace = \const blogPrompt = node.data?.blogPrompt || 'Write a polished blog post with headline, sections, and conclusion.';

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

  let modified = false;

  if (aiGenSearch.test(content)) {
    content = content.replace(aiGenSearch, aiGenReplace);
    console.log('Successfully replaced ai-generation chunk');
    modified = true;
  } else {
    console.log('Could not match ai-generation chunk');
  }

  if (blogSearch.test(content)) {
    content = content.replace(blogSearch, blogReplace);
    console.log('Successfully replaced blog-creation chunk');
    modified = true;
  } else {
    console.log('Could not match blog-creation chunk');
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Wrote updated content to file');
  }
} catch (error) {
  console.error('Error running script:', error);
}
