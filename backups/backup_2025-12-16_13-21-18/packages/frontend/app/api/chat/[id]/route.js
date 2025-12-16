import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';

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

        return NextResponse.json({ messages: result.rows });
    } catch (error) {
        console.error('Get messages error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}
