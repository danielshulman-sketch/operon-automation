import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';

// Get all automations for organization
export async function GET(request) {
    try {
        const user = await requireAuth(request);

        const result = await query(
            `SELECT 
                id, name, description, trigger_type, trigger_config, 
                steps, is_active, created_at, updated_at
             FROM workflow_definitions
             WHERE org_id = $1
             ORDER BY updated_at DESC`,
            [user.org_id]
        );

        return NextResponse.json({ automations: result.rows });
    } catch (error) {
        console.error('Get automations error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch automations' },
            { status: 500 }
        );
    }
}

// Create new automation
export async function POST(request) {
    try {
        const user = await requireAuth(request);
        const { name, description, triggerType, triggerConfig, steps } = await request.json();

        if (!name || !triggerType) {
            return NextResponse.json(
                { error: 'Name and trigger type are required' },
                { status: 400 }
            );
        }

        const result = await query(
            `INSERT INTO workflow_definitions 
             (org_id, name, description, trigger_type, trigger_config, steps)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, name, description, trigger_type, trigger_config, 
                       steps, is_active, created_at, updated_at`,
            [
                user.org_id,
                name,
                description || null,
                triggerType,
                JSON.stringify(triggerConfig || {}),
                JSON.stringify(steps || [])
            ]
        );

        return NextResponse.json({
            success: true,
            automation: result.rows[0]
        });
    } catch (error) {
        console.error('Create automation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create automation' },
            { status: 500 }
        );
    }
}
