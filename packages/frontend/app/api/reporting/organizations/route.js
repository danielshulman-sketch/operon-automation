import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAdmin } from '@/utils/auth';

export async function GET(request) {
    try {
        const user = await requireAdmin(request);
        const params = [];
        let filterClause = '';

        if (!user.is_superadmin) {
            params.push(user.org_id);
            filterClause = 'WHERE o.id = $1';
        }

        const result = await query(
            `SELECT
                o.id,
                o.name,
                COALESCE(tasks.outstanding_tasks, 0) as outstanding_tasks,
                COALESCE(activity.active_minutes_7d, 0) as active_minutes_7d,
                COALESCE(activity.active_users_7d, 0) as active_users_7d,
                activity.last_activity_at
            FROM organisations o
            LEFT JOIN (
                SELECT org_id, COUNT(*) as outstanding_tasks
                FROM detected_tasks
                WHERE status != 'completed'
                GROUP BY org_id
            ) tasks ON tasks.org_id = o.id
            LEFT JOIN (
                SELECT
                    org_id,
                    COUNT(DISTINCT date_trunc('minute', created_at)) as active_minutes_7d,
                    COUNT(DISTINCT user_id) as active_users_7d,
                    MAX(created_at) as last_activity_at
                FROM user_activity
                WHERE created_at >= NOW() - INTERVAL '7 days'
                GROUP BY org_id
            ) activity ON activity.org_id = o.id
            ${filterClause}
            ORDER BY o.name ASC`,
            params
        );

        return NextResponse.json({ organizations: result.rows });
    } catch (error) {
        console.error('Get reporting organizations error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch reporting data' },
            { status: error.message === 'Admin access required' ? 403 : 500 }
        );
    }
}
