import { NextResponse } from 'next/server';
import { query, getClient } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { generateChatResponse } from '@/utils/openai';
import { formatAssistantMessage } from './format-message';

const ALLOWED_CHAT_TYPES = ['general', 'business', 'persona'];

const parseSampleEmails = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
        return JSON.parse(value);
    } catch (error) {
        return [];
    }
};

// Get chat conversations for user
export async function GET(request) {
    try {
        const user = await requireAuth(request);

        const result = await query(
            `SELECT id, chat_type, title, created_at, updated_at
             FROM chat_conversations
             WHERE user_id = $1
             ORDER BY updated_at DESC`,
            [user.id]
        );

        return NextResponse.json({ conversations: result.rows });
    } catch (error) {
        console.error('Get conversations error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch conversations' },
            { status: 500 }
        );
    }
}

// Send message and get AI response
export async function POST(request) {
    const client = await getClient();

    try {
        const user = await requireAuth(request);

        const { conversationId, message, chatType } = await request.json();

        if (!message || !chatType) {
            return NextResponse.json(
                { error: 'Message and chat type are required' },
                { status: 400 }
            );
        }

        if (!ALLOWED_CHAT_TYPES.includes(chatType)) {
            return NextResponse.json(
                { error: 'Unsupported chat type' },
                { status: 400 }
            );
        }

        await client.query('BEGIN');

        let convId = conversationId;

        // Create new conversation if needed
        if (!convId) {
            const convResult = await client.query(
                `INSERT INTO chat_conversations (user_id, org_id, chat_type, title)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id`,
                [user.id, user.org_id, chatType, message.substring(0, 100)]
            );
            convId = convResult.rows[0].id;
        }

        // Save user message
        await client.query(
            `INSERT INTO chat_messages (conversation_id, role, content)
             VALUES ($1, 'user', $2)`,
            [convId, message]
        );

        // Get conversation history
        const historyResult = await client.query(
            `SELECT role, content
             FROM chat_messages
             WHERE conversation_id = $1
             ORDER BY created_at ASC
             LIMIT 20`,
            [convId]
        );

        const messages = historyResult.rows.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // For business chat, get relevant knowledge base context
        let systemPrompt = 'You are a helpful AI assistant.';

        if (chatType === 'business') {
            const kbResult = await client.query(
                `SELECT title, content, category
                 FROM knowledge_base
                 WHERE org_id = $1 AND is_active = true
                 ORDER BY updated_at DESC
                 LIMIT 5`,
                [user.org_id]
            );

            if (kbResult.rows.length > 0) {
                // Truncate content to prevent token overflow
                const context = kbResult.rows.map(doc => {
                    const truncatedContent = doc.content.length > 1000
                        ? doc.content.substring(0, 1000) + '...'
                        : doc.content;
                    return `Title: ${doc.title}\nCategory: ${doc.category || 'General'}\nContent: ${truncatedContent}`;
                }).join('\n\n---\n\n');

                systemPrompt = `You are a business assistant trained on the company's SOPs and documentation. Use the following knowledge base to answer questions accurately. If the answer is not in the knowledge base, say so clearly.

KNOWLEDGE BASE:
${context}

Answer questions based on this information. Be concise and helpful.`;
            } else {
                systemPrompt = 'You are a business assistant. Note: No company documentation has been uploaded yet. Please ask your admin to add SOPs and documentation to the knowledge base.';
            }
        }

        if (chatType === 'persona') {
            const profileResult = await client.query(
                `SELECT * FROM voice_profiles WHERE user_id = $1 AND is_trained = true LIMIT 1`,
                [user.id]
            );

            if (profileResult.rows.length === 0) {
                await client.query('ROLLBACK');
                client.release();
                return NextResponse.json(
                    { error: 'No voice profile found. Please complete voice training first.' },
                    { status: 400 }
                );
            }

            const profile = profileResult.rows[0];
            const sampleEmails = parseSampleEmails(profile.sample_emails)
                .filter((sample) => typeof sample === 'string' && sample.trim().length > 0)
                .slice(0, 3)
                .map((sample) => sample.trim().slice(0, 1200));

            let writingStyle = profile.writing_style || {};
            if (typeof writingStyle === 'string') {
                try {
                    writingStyle = JSON.parse(writingStyle);
                } catch (error) {
                    writingStyle = {};
                }
            }
            const commonPhrases = Array.isArray(writingStyle.common_phrases)
                ? writingStyle.common_phrases.slice(0, 8).join(', ')
                : '';

            const samplesBlock = sampleEmails.length > 0
                ? `SAMPLE EMAILS (style reference only, do not quote directly):
${sampleEmails.map((sample, index) => `Sample ${index + 1}:\n${sample}`).join('\n\n')}`
                : 'No sample emails available.';

            systemPrompt = `You are an AI persona that answers questions in the user's voice. Write as the user would, using first-person when appropriate. Keep responses concise, natural, and confident. Do not mention that you are an AI or refer to the samples.

Voice Profile:
- Tone: ${profile.tone || 'professional'}
- Formality: ${profile.formality_level || 3}/5
- Typical greeting: ${writingStyle.greeting || 'Hi'}
- Typical closing: ${writingStyle.closing || 'Best'}
- Sentence length: ${writingStyle.sentence_length || 'medium'}
- Emoji usage: ${writingStyle.emoji_usage || 'rarely'}
- Exclamation usage: ${writingStyle.exclamation_usage || 'sometimes'}
- Common phrases: ${commonPhrases || 'n/a'}

${samplesBlock}`;
        }

        const completion = await generateChatResponse({
            orgId: user.org_id,
            systemPrompt,
            messages,
            temperature: 0.7,
            maxTokens: 1000,
        });

        const assistantMessage = completion.content || '';
        const formattedAssistantMessage = formatAssistantMessage(assistantMessage);

        // Save assistant response
        await client.query(
            `INSERT INTO chat_messages (conversation_id, role, content, metadata)
             VALUES ($1, 'assistant', $2, $3)`,
            [
                convId,
                assistantMessage,
                JSON.stringify({ provider: completion.provider, model: completion.model }),
            ]
        );

        // Update conversation timestamp
        await client.query(
            `UPDATE chat_conversations SET updated_at = NOW() WHERE id = $1`,
            [convId]
        );

        await client.query('COMMIT');

        return NextResponse.json({
            success: true,
            conversationId: convId,
            message: formattedAssistantMessage
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Chat error:', error);
        if (error?.message?.includes('AI API key')) {
            return NextResponse.json(
                { error: 'AI API key is invalid or missing. Please update your API key in settings.' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: error.message || 'Failed to process chat' },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}
