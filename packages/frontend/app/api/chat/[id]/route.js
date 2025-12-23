import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { formatAssistantMessage } from '../format-message';

export async function GET(request, { params }) {
    try {
        const user = await requireAuth(request);

        const { id: conversationId } = params;

        // Verify user owns this conversation
        const convCheck = await query(
            `SELECT id FROM chat_conversations WHERE id = $1 AND user_id = $2`,
            [conversationId, user.id]
        );

        if (convCheck.rows.length === 0) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Get messages
        const result = await query(
            `SELECT id, role, content, metadata, created_at
             FROM chat_messages
             WHERE conversation_id = $1
             ORDER BY created_at ASC`,
            [conversationId]
        );

        const messages = result.rows.map((message) => ({
            ...message,
            content:
                message.role === 'assistant'
                    ? formatAssistantMessage(message.content || '')
                    : message.content,
        }));

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Get messages error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = await requireAuth(request);
        const { id: conversationId } = params;

        const convCheck = await query(
            `SELECT id FROM chat_conversations WHERE id = $1 AND user_id = $2`,
            [conversationId, user.id]
        );

        if (convCheck.rows.length === 0) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        await query(
            `DELETE FROM chat_messages WHERE conversation_id = $1`,
            [conversationId]
        );

        await query(
            `DELETE FROM chat_conversations WHERE id = $1`,
            [conversationId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete conversation error:', error);
        return NextResponse.json(
            { error: 'Failed to delete conversation' },
            { status: 500 }
        );
    }
}
