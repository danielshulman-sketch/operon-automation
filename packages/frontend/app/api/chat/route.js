import { NextResponse } from 'next/server';
import { query, getClient } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Get chat conversations for user
export async function GET(request) {
    try {
        const user = await requireAuth(request);

        const result = await query(
            `SELECT id, chat_type, title, created_at, updated_at
             FROM chat_conversations
             WHERE user_id = $1
             ORDER BY updated_at DESC
             LIMIT 50`,
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

        // Get organization's API key or use global default
        const apiKeyResult = await client.query(
            `SELECT openai_api_key FROM org_api_keys WHERE org_id = $1`,
            [user.org_id]
        );

        let apiKey = process.env.OPENAI_API_KEY; // Global default
        if (apiKeyResult.rows.length > 0) {
            apiKey = apiKeyResult.rows[0].openai_api_key; // Organization-specific key
        }

        if (!apiKey) {
            await client.query('ROLLBACK');
            client.release();
            return NextResponse.json(
                { error: 'No API key configured. Please ask your admin to add an OpenAI API key in settings.' },
                { status: 400 }
            );
        }

        // Create OpenAI client with the appropriate API key
        const openaiClient = new OpenAI({ apiKey });

        // Call OpenAI API
        const completion = await openaiClient.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        const assistantMessage = completion.choices[0].message.content;

        // Save assistant response
        await client.query(
            `INSERT INTO chat_messages (conversation_id, role, content, metadata)
             VALUES ($1, 'assistant', $2, $3)`,
            [convId, assistantMessage, JSON.stringify({ model: 'gpt-4-turbo-preview' })]
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
            message: assistantMessage
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Chat error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process chat' },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}
