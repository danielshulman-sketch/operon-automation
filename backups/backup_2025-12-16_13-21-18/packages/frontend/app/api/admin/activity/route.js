import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';

export async function GET(request) {
    try {
        const user = await requireAuth(request);

        // Get recent activity
        const result = await query(
            `SELECT a.*, u.email, u.first_name, u.last_name
       FROM user_activity a
       JOIN users u ON a.user_id = u.id
       WHERE a.org_id = $1
       ORDER BY a.created_at DESC
       LIMIT 10`,
            [user.org_id]
        );

        return NextResponse.json({ activities: result.rows });
    } catch (error) {
        console.error('Get activity error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch activity' },
            { status: 500 }
        );
    }
}
