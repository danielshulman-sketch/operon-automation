import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from './db';
import { ensureAiSettingsTable } from './ensure-ai-settings';
import { getOrgOpenAIKey } from './openai-keys';
import { decrypt } from './encryption';

const DEFAULT_MODELS = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-sonnet-20240620',
    google: 'gemini-1.5-pro',
};

const ALLOWED_PROVIDERS = ['openai', 'anthropic', 'google', 'abacus'];

const normalizeProvider = (provider) =>
    ALLOWED_PROVIDERS.includes(provider) ? provider : 'openai';

const createOpenAIClient = (apiKey) =>
    apiKey
        ? new OpenAI({
            apiKey,
        })
        : null;

const createAnthropicClient = (apiKey) =>
    apiKey
        ? new Anthropic({
            apiKey,
        })
        : null;

const createGeminiClient = (apiKey) =>
    apiKey ? new GoogleGenerativeAI(apiKey) : null;

const defaultOpenAIKey = process.env.OPENAI_API_KEY;
const defaultAnthropicKey = process.env.ANTHROPIC_API_KEY;
const defaultGoogleKey = process.env.GOOGLE_API_KEY;

async function resolveOrgAiSettings(orgId) {
    if (!orgId) {
        return {
            provider: 'openai',
            model: DEFAULT_MODELS.openai,
            openaiKey: defaultOpenAIKey || null,
            anthropicKey: defaultAnthropicKey || null,
            googleKey: defaultGoogleKey || null,
            abacusKey: process.env.ABACUS_API_KEY || null,
            abacusDeploymentId: process.env.ABACUS_DEPLOYMENT_ID || null,
        };
    }

    await ensureAiSettingsTable();

    const result = await query(
        `SELECT provider, model, openai_api_key, anthropic_api_key, google_api_key, abacus_api_key, abacus_deployment_id
         FROM org_ai_settings
         WHERE org_id = $1
         LIMIT 1`,
        [orgId]
    );

    const row = result.rows[0] || {};
    const provider = normalizeProvider(row.provider || 'openai');
    const model = row.model || DEFAULT_MODELS[provider];
    const openaiKey = decrypt(row.openai_api_key) || (await getOrgOpenAIKey(orgId)) || defaultOpenAIKey || null;
    const anthropicKey = decrypt(row.anthropic_api_key) || defaultAnthropicKey || null;
    const googleKey = decrypt(row.google_api_key) || defaultGoogleKey || null;
    const abacusKey = decrypt(row.abacus_api_key) || process.env.ABACUS_API_KEY || null;
    const abacusDeploymentId = row.abacus_deployment_id || process.env.ABACUS_DEPLOYMENT_ID || null;

    return {
        provider,
        model,
        openaiKey,
        anthropicKey,
        googleKey,
        abacusKey,
        abacusDeploymentId,
    };
}

function getProviderKey(settings) {
    if (settings.provider === 'anthropic') {
        return settings.anthropicKey;
    }
    if (settings.provider === 'google') {
        return settings.googleKey;
    }
    if (settings.provider === 'abacus') {
        return settings.abacusKey;
    }
    return settings.openaiKey;
}

function extractJson(text) {
    if (!text) {
        throw new Error('Empty AI response');
    }

    try {
        return JSON.parse(text);
    } catch (error) {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            const candidate = text.slice(start, end + 1);
            return JSON.parse(candidate);
        }
        throw error;
    }
}

async function runStructuredPrompt({ orgId, systemPrompt, userPrompt, maxTokens = 800 }) {
    const settings = await resolveOrgAiSettings(orgId);
    const apiKey = getProviderKey(settings);

    if (!apiKey) {
        throw new Error('AI API key is invalid or missing. Please update your API key in settings.');
    }

    if (settings.provider === 'anthropic') {
        const client = createAnthropicClient(apiKey);
        const completion = await client.messages.create({
            model: settings.model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: `${userPrompt}\n\nReturn ONLY valid JSON, no code fences.`,
                },
            ],
        });

        const text = completion.content?.[0]?.text || '';
        return extractJson(text);
    }

    if (settings.provider === 'google') {
        const client = createGeminiClient(apiKey);
        const model = client.getGenerativeModel({ model: settings.model });
        const prompt = `${systemPrompt}\n\n${userPrompt}\n\nReturn ONLY valid JSON, no code fences.`;
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens },
        });

        const text = result.response?.text() || '';
        return extractJson(text);
    }

    const client = createOpenAIClient(apiKey);
    const completion = await client.chat.completions.create({
        model: settings.model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: maxTokens,
    });

    return extractJson(completion.choices?.[0]?.message?.content || '');
}

async function generateAbacusResponse({ apiKey, deploymentId, systemPrompt, messages, temperature, maxTokens }) {
    const abacusMessages = [
        { is_user: false, text: systemPrompt },
        ...messages.map(m => ({
            is_user: m.role === 'user',
            text: m.content
        }))
    ];

    const response = await fetch(`https://abacus.ai/api/v0/getChatResponse`, {
        method: 'POST',
        headers: {
            'x-abacus-api-key': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            deploymentId,
            messages: abacusMessages,
            temperature,
            maxTokens
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Abacus AI error: ${err.error || response.statusText}`);
    }

    const data = await response.json();
    return {
        content: data.result?.text || '',
        model: deploymentId
    };
}

export async function generateChatResponse({
    orgId,
    systemPrompt,
    messages,
    temperature = 0.7,
    maxTokens = 1000,
}) {
    const settings = await resolveOrgAiSettings(orgId);
    const apiKey = getProviderKey(settings);

    if (!apiKey) {
        throw new Error('AI API key is invalid or missing. Please update your API key in settings.');
    }

    if (settings.provider === 'anthropic') {
        const client = createAnthropicClient(apiKey);
        const completion = await client.messages.create({
            model: settings.model,
            max_tokens: maxTokens,
            temperature,
            system: systemPrompt,
            messages: messages.map((message) => ({
                role: message.role === 'assistant' ? 'assistant' : 'user',
                content: message.content,
            })),
        });

        return {
            provider: settings.provider,
            model: settings.model,
            content: completion.content?.[0]?.text || '',
        };
    }

    if (settings.provider === 'google') {
        const client = createGeminiClient(apiKey);
        const model = client.getGenerativeModel({ model: settings.model });
        const contents = [
            { role: 'user', parts: [{ text: `System instructions:\n${systemPrompt}` }] },
            ...messages.map((message) => ({
                role: message.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: message.content }],
            })),
        ];
        const result = await model.generateContent({
            contents,
            generationConfig: { temperature, maxOutputTokens: maxTokens },
        });

        return {
            provider: settings.provider,
            model: settings.model,
            content: result.response?.text() || '',
        };
    }

    if (settings.provider === 'abacus') {
        if (!settings.abacusDeploymentId) {
            throw new Error('Abacus Deployment ID is missing in settings.');
        }

        const result = await generateAbacusResponse({
            apiKey,
            deploymentId: settings.abacusDeploymentId,
            systemPrompt,
            messages,
            temperature,
            maxTokens
        });

        return {
            provider: 'abacus',
            model: result.model,
            content: result.content
        };
    }

    const client = createOpenAIClient(apiKey);
    const completion = await client.chat.completions.create({
        model: settings.model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature,
        max_tokens: maxTokens,
    });

    return {
        provider: settings.provider,
        model: settings.model,
        content: completion.choices?.[0]?.message?.content || '',
    };
}

export async function classifyEmail(emailContent = '', options = {}) {
    const { orgId } = options;

    try {
        const settings = await resolveOrgAiSettings(orgId);
        const apiKey = getProviderKey(settings);
        if (!apiKey) {
            console.warn('AI API key missing, using heuristic email classification.');
            return heuristicClassification(emailContent);
        }
    } catch (error) {
        console.warn('AI settings missing, using heuristic email classification.');
        return heuristicClassification(emailContent);
    }

    try {
        return await runStructuredPrompt({
            orgId,
            systemPrompt: `You are an email classification assistant. Classify emails into one of these categories:
- "task" - Action required
- "fyi" - Information only
- "question" - Requires response
- "approval" - Needs approval
- "meeting" - Meeting related

Also extract any tasks mentioned in the email.

Respond in JSON format:
{
  "classification": "task|fyi|question|approval|meeting",
  "tasks": [
    {
      "title": "Task title",
      "description": "Task description",
      "priority": "high|medium|low",
      "due_date": "ISO date or null"
    }
      ]
}`,
            userPrompt: emailContent,
            maxTokens: 700,
        });
    } catch (error) {
        console.error('AI classifyEmail failed, falling back to heuristics:', error.message);
        return heuristicClassification(emailContent);
    }
}

export async function analyzeVoiceProfile(samples, responses, options = {}) {
    const { orgId } = options;

    return runStructuredPrompt({
        orgId,
        systemPrompt: `You are a writing style analyzer. Analyze the provided email samples and questionnaire responses to create a voice profile.

Respond in JSON format:
{
  "tone": "professional|casual|friendly|formal",
  "formality_level": 1-5,
  "writing_style": {
    "greeting": "typical greeting",
    "closing": "typical closing",
    "sentence_length": "short|medium|long",
    "emoji_usage": "never|rarely|sometimes|often",
    "exclamation_usage": "rarely|sometimes|often",
    "common_phrases": ["phrase1", "phrase2"]
  },
  "quality_score": 0.0-1.0
}`,
        userPrompt: `Sample Emails:\n${samples.join('\n\n---\n\n')}\n\nQuestionnaire Responses:\n${JSON.stringify(responses, null, 2)}`,
        maxTokens: 900,
    });
}

export async function generateDraft(emailContent, voiceProfile, options = {}) {
    const { orgId } = options;
    const profile = voiceProfile || {};
    const writingStyle = profile.writing_style || {};

    return runStructuredPrompt({
        orgId,
        systemPrompt: `You are an email draft generator. Generate a professional email response based on the user's voice profile.

Voice Profile:
- Tone: ${profile.tone || 'professional'}
- Formality: ${profile.formality_level || 3}/5
- Greeting: ${writingStyle.greeting || 'Hi'}
- Closing: ${writingStyle.closing || 'Best regards'}
- Sentence length: ${writingStyle.sentence_length || 'medium'}

Respond in JSON format:
{
  "subject": "Re: Original subject",
  "body": "Full email body"
}`,
        userPrompt: `Generate a reply to this email:\n\n${emailContent}`,
        maxTokens: 900,
    });
}

function parseDataUrl(dataUrl) {
    const match = /^data:(.+?);base64,(.+)$/.exec(dataUrl || '');
    if (!match) {
        return null;
    }
    return { mediaType: match[1], base64: match[2] };
}

const FOOD_ANALYSIS_SYSTEM_PROMPT = `You are a nutrition assistant helping someone track links between what they eat/drink and their symptoms. Their goal is finding specific ingredients that might be triggering symptoms, so ingredient-level detail matters more than a generic dish name.

Look at the photo (if provided) and description of a food or drink item:
- If the photo shows packaging, a wrapper, a menu, or a nutrition/ingredients label with legible text, read the ingredients list closely and extract the individual ingredients from it verbatim (e.g. "wheat flour", "monosodium glutamate", "soy lecithin", "sulfites", "red 40", "high fructose corn syrup") — this is the most reliable source, prefer it over guessing.
- If no label is visible, infer the most likely individual ingredients from what the dish/drink visibly is or from the description (e.g. a burger implies "beef", "wheat bun", "cheese"). Mark this lower-confidence case with "ingredients_from_label": false.
- If you found and read an actual ingredients list, set "ingredients_from_label": true.

Respond in JSON format:
{
  "items": ["short name of each distinct food/drink identified, e.g. 'coffee', 'fried chicken'"],
  "ingredients": ["individual ingredients, as specific as possible, lowercase, one per entry"],
  "ingredients_from_label": true|false,
  "category": "meal|snack|drink|dessert|other",
  "possible_triggers": ["common symptom triggers present, choose from: dairy, gluten, caffeine, alcohol, spicy, high-sugar, processed, fried, high-fat, artificial-sweetener, histamine, nightshade, citrus, none"],
  "summary": "one short sentence describing the item(s)"
}
Base "possible_triggers" on the actual ingredients you listed wherever possible (e.g. "milk" or "whey" in ingredients implies dairy; "monosodium glutamate" implies processed). Only use information visible in the photo or provided in the description. If you cannot tell, make a reasonable best guess from the description alone.`;

export async function analyzeFoodImage({ orgId, imageDataUrl, description }) {
    let settings;
    let apiKey;

    try {
        settings = await resolveOrgAiSettings(orgId);
        apiKey = getProviderKey(settings);
    } catch (error) {
        console.warn('AI settings unavailable for food analysis:', error.message);
        return null;
    }

    if (!apiKey) {
        return null;
    }

    const userText = description
        ? `Description provided by the user: ${description}`
        : 'No description provided; rely on the photo.';

    try {
        if (settings.provider === 'anthropic' && imageDataUrl) {
            const parsed = parseDataUrl(imageDataUrl);
            const client = createAnthropicClient(apiKey);
            const completion = await client.messages.create({
                model: settings.model,
                max_tokens: 500,
                system: FOOD_ANALYSIS_SYSTEM_PROMPT,
                messages: [
                    {
                        role: 'user',
                        content: [
                            ...(parsed
                                ? [{ type: 'image', source: { type: 'base64', media_type: parsed.mediaType, data: parsed.base64 } }]
                                : []),
                            { type: 'text', text: `${userText}\n\nReturn ONLY valid JSON, no code fences.` },
                        ],
                    },
                ],
            });

            return extractJson(completion.content?.[0]?.text || '');
        }

        if (settings.provider === 'openai') {
            const client = createOpenAIClient(apiKey);
            const completion = await client.chat.completions.create({
                model: settings.model,
                messages: [
                    { role: 'system', content: FOOD_ANALYSIS_SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: userText },
                            ...(imageDataUrl ? [{ type: 'image_url', image_url: { url: imageDataUrl } }] : []),
                        ],
                    },
                ],
                response_format: { type: 'json_object' },
                max_tokens: 500,
            });

            return extractJson(completion.choices?.[0]?.message?.content || '');
        }

        // Providers without straightforward vision support here (google/abacus):
        // fall back to a text-only structured prompt using the description.
        return await runStructuredPrompt({
            orgId,
            systemPrompt: FOOD_ANALYSIS_SYSTEM_PROMPT,
            userPrompt: userText,
            maxTokens: 500,
        });
    } catch (error) {
        console.error('analyzeFoodImage failed:', error.message);
        return null;
    }
}

export async function generateEmbedding(text) {
    const openai = createOpenAIClient(defaultOpenAIKey);
    if (!openai) {
        throw new Error('OpenAI API key missing. Please add OPENAI_API_KEY to generate embeddings.');
    }

    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
    });

    return response.data[0].embedding;
}

function heuristicClassification(emailContent = '') {
    const text = emailContent.toLowerCase();

    const matchesAny = (keywords) => keywords.some((keyword) => text.includes(keyword));

    let classification = 'fyi';

    if (matchesAny(['action required', 'due', 'deadline', 'asap', 'please complete', 'follow up'])) {
        classification = 'task';
    } else if (matchesAny(['can you', 'could you', 'do you know', 'question', '?'])) {
        classification = 'question';
    } else if (matchesAny(['approve', 'approval', 'sign off', 'authorize'])) {
        classification = 'approval';
    } else if (matchesAny(['meeting', 'call', 'schedule', 'calendar', 'invite'])) {
        classification = 'meeting';
    }

    const tasks = [];
    if (classification === 'task') {
        const potentialTasks = emailContent
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./) || line.toLowerCase().includes('todo')))
            .slice(0, 3);

        potentialTasks.forEach((line, index) => {
            tasks.push({
                title: `Task ${index + 1}`,
                description: line.replace(/^[-*\d. ]+/, '').trim(),
                priority: matchesAny(['urgent', 'asap', 'high priority']) ? 'high' : 'medium',
                due_date: null,
            });
        });
    }

    return {
        classification,
        tasks,
    };
}
