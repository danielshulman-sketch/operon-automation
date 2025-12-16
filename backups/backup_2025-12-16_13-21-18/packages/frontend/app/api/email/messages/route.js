import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';

export async function GET(request) {
    try {
        const user = await requireAuth(request);
        const { searchParams } = new URL(request.url);
        const classification = searchParams.get('classification');

        let queryText = `
      SELECT id, from_address, subject, body_text, classification, is_read, received_at, created_at
      FROM email_messages
      WHERE org_id = $1
    `;
        const params = [user.org_id];

        if (classification && classification !== 'all') {
            queryText += ` AND classification = $2`;
            params.push(classification);
        }

        queryText += ` ORDER BY received_at DESC LIMIT 100`;

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
