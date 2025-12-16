import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';

export async function GET(request) {
    try {
        const user = await requireAuth(request);
        const { searchParams } = new URL(request.url);
        const replyTo = searchParams.get('reply_to');

        let queryText = `
      SELECT d.*, e.subject as original_subject
      FROM email_drafts d
      LEFT JOIN email_messages e ON d.reply_to_message_id = e.id
      WHERE d.org_id = $1 AND d.user_id = $2
    `;
        const params = [user.org_id, user.id];

        if (replyTo) {
            queryText += ` AND d.reply_to_message_id = $3`;
            params.push(replyTo);
        }

        queryText += ` ORDER BY d.created_at DESC LIMIT 50`;

        const result = await query(queryText, params);

        return NextResponse.json({ drafts: result.rows });
    } catch (error) {
        console.error('Get drafts error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch drafts' },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const user = await requireAuth(request);
        const { id, subject, body } = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: 'Draft ID is required' },
                { status: 400 }
            );
        }

        const result = await query(
            `UPDATE email_drafts 
       SET subject = $1, body = $2, updated_at = NOW()
       WHERE id = $3 AND org_id = $4 AND user_id = $5
       RETURNING *`,
            [subject, body, id, user.org_id, user.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Draft not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ draft: result.rows[0] });
    } catch (error) {
        console.error('Update draft error:', error);
        return NextResponse.json(
            { error: 'Failed to update draft' },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const user = await requireAuth(request);
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Draft ID is required' },
                { status: 400 }
            );
        }

        await query(
            `DELETE FROM email_drafts 
       WHERE id = $1 AND org_id = $2 AND user_id = $3`,
            [id, user.org_id, user.id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete draft error:', error);
        return NextResponse.json(
            { error: 'Failed to delete draft' },
            { status: 500 }
        );
    }
}
