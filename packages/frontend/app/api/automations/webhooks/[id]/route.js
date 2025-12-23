import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { executeAutomation } from '@/lib/automation/engine';
import { ensureAutomationTables } from '@/utils/ensure-automation-tables';

export async function POST(request, { params }) {
    const { id: webhookId } = params;

    console.log(`Received webhook for ID: ${webhookId}`);

    try {
        await ensureAutomationTables();
        // 1. Find the automation with this webhook ID
        // Note: In Postgres specific JSONB query to find trigger_config->>'webhookId' matching
        // Syntax: trigger_config->>'webhookId' = $1

        const result = await query(
            `SELECT * FROM workflow_definitions 
             WHERE trigger_type = 'webhook' 
             AND trigger_config->>'webhookId' = $1
             AND is_active = true`,
            [webhookId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Webhook not found or inactive' },
                { status: 404 }
            );
        }

        const automation = result.rows[0];

        // 2. Parse payload
        let payload = {};
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            try {
                payload = await request.json();
            } catch (e) {
                console.warn('Failed to parse JSON body');
            }
        }
        // Could support form-data here too if needed

        // 3. Execute Automation
        // We pass the payload into the "webhook" variable namespace
        const runId = `webhook_${webhookId}_${Date.now()}`;

        // Execute asynchronously (fire and forget from caller perspective, or await?)
        // For webhooks, generally good to return 200 OK quickly.
        // But for this MVP, running it ensures we capture errors. 
        // Let's run it but catch errors so we still return 200 OK if the hook was received,
        // or 500 if execution failed? 
        // Actually, usually webhooks just want acknowledgement of receipt.

        executeAutomation(runId, automation, { webhook: payload }, automation.org_id)
            .catch(err => console.error('Webhook execution failed:', err));

        return NextResponse.json({ success: true, runId });

    } catch (error) {
        console.error('Webhook handler error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request, { params }) {
    return NextResponse.json(
        { error: 'Method not allowed. Use POST.' },
        { status: 405 }
    );
}
