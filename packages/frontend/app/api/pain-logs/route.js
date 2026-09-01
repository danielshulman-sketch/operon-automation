import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { ensureFoodPainTrackerTables } from '@/utils/ensure-food-pain-tracker';

export async function GET(request) {
    try {
        const user = await requireAuth(request);
        await ensureFoodPainTrackerTables();

        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        let queryText = `SELECT * FROM pain_logs WHERE org_id = $1 AND user_id = $2`;
        const params = [user.org_id, user.id];

        if (from) {
            params.push(from);
            queryText += ` AND log_date >= $${params.length}`;
        }
        if (to) {
            params.push(to);
            queryText += ` AND log_date <= $${params.length}`;
        }

        queryText += ` ORDER BY log_date DESC, created_at DESC LIMIT 200`;

        const result = await query(queryText, params);

        return NextResponse.json({ painLogs: result.rows });
    } catch (error) {
        console.error('Get pain logs error:', error);
        return NextResponse.json({ error: 'Failed to fetch pain logs' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await requireAuth(request);
        await ensureFoodPainTrackerTables();

        const { painLevel, notes, logDate } = await request.json();

        const level = Number(painLevel);
        if (!Number.isInteger(level) || level < 0 || level > 10) {
            return NextResponse.json(
                { error: 'painLevel must be a whole number between 0 and 10' },
                { status: 400 }
            );
        }

        const resolvedDate = logDate || new Date().toISOString().slice(0, 10);

        // Append-only: every save is a new row with its own timestamp, so a pain level
        // changed several times in a day keeps a full timestamped history for analysis
        // instead of only the latest value overwriting the rest.
        const result = await query(
            `INSERT INTO pain_logs (org_id, user_id, log_date, pain_level, notes)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [user.org_id, user.id, resolvedDate, level, notes || null]
        );

        return NextResponse.json({ painLog: result.rows[0] });
    } catch (error) {
        console.error('Create pain log error:', error);
        return NextResponse.json({ error: 'Failed to save pain log' }, { status: 500 });
    }
}
