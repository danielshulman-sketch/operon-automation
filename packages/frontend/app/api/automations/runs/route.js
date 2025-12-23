import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { ensureAutomationTables } from '@/utils/ensure-automation-tables';

// List all runs for the organization, optionally filtered by automation id
export async function GET(request) {
    try {
        const user = await requireAuth(request);
        await ensureAutomationTables();
        const { searchParams } = new URL(request.url);
        const automationId = searchParams.get('automationId');

        let sql = `
            SELECT r.id, r.status, r.started_at, r.completed_at, r.error_message,
                   w.name as workflow_name
            FROM workflow_runs r
            JOIN workflow_definitions w ON r.workflow_id = w.id
            WHERE r.org_id = $1
        `;
        const params = [user.org_id];

        if (automationId) {
            sql += ` AND r.workflow_id = $2`;
            params.push(automationId);
        }

        sql += ` ORDER BY r.started_at DESC LIMIT 50`;

        const result = await query(sql, params);

        return NextResponse.json({ runs: result.rows });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
