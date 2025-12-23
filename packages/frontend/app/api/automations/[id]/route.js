import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { ensureAutomationTables } from '@/utils/ensure-automation-tables';

// Get, Update, Delete specific automation
export async function GET(request, { params }) {
    try {
        const user = await requireAuth(request);
        await ensureAutomationTables();
        const { id } = params;

        const result = await query(
            `SELECT 
                id, name, description, trigger_type, trigger_config, 
                steps, is_active, created_at, updated_at
             FROM workflow_definitions
             WHERE id = $1 AND org_id = $2`,
            [id, user.org_id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
        }

        return NextResponse.json({ automation: result.rows[0] });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const user = await requireAuth(request);
        await ensureAutomationTables();
        const { id } = params;
        const { name, description, triggerType, triggerConfig, steps } = await request.json();

        const result = await query(
            `UPDATE workflow_definitions
             SET name = $1, description = $2, trigger_type = $3, 
                 trigger_config = $4, steps = $5, updated_at = NOW()
             WHERE id = $6 AND org_id = $7
             RETURNING id, name`,
            [
                name,
                description,
                triggerType,
                JSON.stringify(triggerConfig || {}),
                JSON.stringify(steps || []),
                id,
                user.org_id
            ]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, automation: result.rows[0] });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = await requireAuth(request);
        await ensureAutomationTables();
        const { id } = params;

        const result = await query(
            `DELETE FROM workflow_definitions
             WHERE id = $1 AND org_id = $2
             RETURNING id`,
            [id, user.org_id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
