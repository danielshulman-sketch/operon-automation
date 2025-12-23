import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { ensureEmailRepliesTable } from '@/utils/ensure-email-replies';

export async function GET(request) {
    try {
        const user = await requireAuth(request);
        await ensureEmailRepliesTable();
        const { searchParams } = new URL(request.url);
        const classification = searchParams.get('classification');

        let queryText = `
      SELECT 
        m.id,
        m.from_address,
        m.subject,
        m.body_text,
        m.classification,
        m.is_read,
        m.received_at,
        m.created_at,
        r.subject AS reply_subject,
        r.body AS reply_body,
        r.sent_at AS replied_at
      FROM email_messages m
      LEFT JOIN LATERAL (
        SELECT subject, body, sent_at
        FROM email_replies
        WHERE reply_to_message_id = m.id AND org_id = $1
        ORDER BY sent_at DESC
        LIMIT 1
      ) r ON true
      WHERE m.org_id = $1
    `;
        const params = [user.org_id];

        if (classification && classification !== 'all') {
            queryText += ` AND m.classification = $2`;
            params.push(classification);
        }

        queryText += ` ORDER BY m.received_at DESC LIMIT 100`;

        const result = await query(queryText, params);

        return NextResponse.json({
            emails: result.rows,
        });
    } catch (error) {
        console.error('Get emails error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch emails' },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const user = await requireAuth(request);
        await ensureEmailRepliesTable();
        const { searchParams } = new URL(request.url);
        const emailId = searchParams.get('id');

        if (!emailId) {
            return NextResponse.json(
                { error: 'Email ID is required' },
                { status: 400 }
            );
        }

        await query(
            `DELETE FROM email_messages WHERE id = $1 AND org_id = $2`,
            [emailId, user.org_id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete email error:', error);
        return NextResponse.json(
            { error: 'Failed to delete email' },
            { status: 500 }
        );
    }
}
