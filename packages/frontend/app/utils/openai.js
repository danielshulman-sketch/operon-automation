import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from './db';
import { ensureAiSettingsTable } from './ensure-ai-settings';
import { getOrgOpenAIKey } from './openai-keys';

const DEFAULT_MODELS = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-sonnet-20240620',
    google: 'gemini-1.5-pro',
};

const ALLOWED_PROVIDERS = ['openai', 'anthropic', 'google'];

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
        };
    }

    await ensureAiSettingsTable();

    const result = await query(
        `SELECT provider, model, openai_api_key, anthropic_api_key, google_api_key
         FROM org_ai_settings
         WHERE org_id = $1
         LIMIT 1`,
        [orgId]
    );

    const row = result.rows[0] || {};
    const provider = normalizeProvider(row.provider || 'openai');
    const model = row.model || DEFAULT_MODELS[provider];
    const openaiKey = row.openai_api_key || (await getOrgOpenAIKey(orgId)) || defaultOpenAIKey || null;
    const anthropicKey = row.anthropic_api_key || defaultAnthropicKey || null;
    const googleKey = row.google_api_key || defaultGoogleKey || null;

    return {
        provider,
        model,
        openaiKey,
        anthropicKey,
        googleKey,
    };
}

function getProviderKey(settings) {
    if (settings.provider === 'anthropic') {
        return settings.anthropicKey;
    }
    if (settings.provider === 'google') {
        return settings.googleKey;
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
