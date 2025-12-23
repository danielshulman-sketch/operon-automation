import { NextResponse } from 'next/server';
import { query, getClient } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { executeAutomation } from '@/lib/automation/engine';
import { ensureAutomationTables } from '@/utils/ensure-automation-tables';

// Manually execute automation
export async function POST(request, { params }) {
    const client = await getClient();

    try {
        const user = await requireAuth(request);
        await ensureAutomationTables();
        const { id } = params;
        const { triggerData } = await request.json();

        await client.query('BEGIN');

        // Get automation definition
        const automationResult = await client.query(
            `SELECT id, name, steps, trigger_type, is_active
             FROM workflow_definitions
             WHERE id = $1 AND org_id = $2`,
            [id, user.org_id]
        );

        if (automationResult.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return NextResponse.json(
                { error: 'Automation not found' },
                { status: 404 }
            );
        }

        const automation = automationResult.rows[0];

        if (!automation.is_active) {
            await client.query('ROLLBACK');
            client.release();
            return NextResponse.json(
                { error: 'Automation is not active' },
                { status: 400 }
            );
        }

        // Create automation run
        const runResult = await client.query(
            `INSERT INTO workflow_runs (org_id, workflow_id, status, trigger_data)
             VALUES ($1, $2, 'running', $3)
             RETURNING id`,
            [user.org_id, automation.id, JSON.stringify(triggerData || {})]
        );

        const runId = runResult.rows[0].id;

        await client.query('COMMIT');
        client.release();

        // Execute automation asynchronously
        executeAutomation(runId, automation, triggerData || {}, user.org_id)
            .catch(err => console.error('Automation execution error:', err));

        return NextResponse.json({
            success: true,
            runId,
            message: 'Automation execution started'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        client.release();
        console.error('Execute automation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to execute automation' },
            { status: 500 }
        );
    }
}
