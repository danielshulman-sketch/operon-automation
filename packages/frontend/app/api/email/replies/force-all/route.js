import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAdmin } from '@/utils/auth';
import { ensureEmailRepliesTable } from '@/utils/ensure-email-replies';

export async function POST(request) {
    try {
        const admin = await requireAdmin(request);
        await ensureEmailRepliesTable();

        const result = await query(
            `INSERT INTO email_replies (
                org_id,
                user_id,
                reply_to_message_id,
                subject,
                body,
                sent_via,
                external_message_id,
                created_at,
                sent_at
            )
            SELECT
                m.org_id,
                $1,
                m.id,
                COALESCE(
                    d.subject,
                    CASE
                        WHEN m.subject IS NULL OR m.subject = '' THEN 'Re: (No Subject)'
                        ELSE 'Re: ' || m.subject
                    END
                ) AS subject,
                COALESCE(d.body, 'Replied (response not recorded)') AS body,
                'forced',
                NULL,
                NOW(),
                NOW()
            FROM email_messages m
            LEFT JOIN LATERAL (
                SELECT subject, body
                FROM email_drafts
                WHERE reply_to_message_id = m.id AND org_id = $2
                ORDER BY created_at DESC
                LIMIT 1
            ) d ON true
            WHERE m.org_id = $2
              AND NOT EXISTS (
                SELECT 1
                FROM email_replies r
                WHERE r.reply_to_message_id = m.id AND r.org_id = $2
              )
            RETURNING id`,
            [admin.id, admin.org_id]
        );

        return NextResponse.json({
            success: true,
            created: result.rowCount || result.rows.length,
        });
    } catch (error) {
        if (error.message === 'Admin access required') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }
        console.error('Force replies error:', error);
        return NextResponse.json(
            { error: 'Failed to mark emails as replied' },
            { status: 500 }
        );
    }
}
