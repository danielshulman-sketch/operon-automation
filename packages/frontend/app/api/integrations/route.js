import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { getAllIntegrations } from '../../lib/integrations/index';
import { query } from '@/utils/db';
import { decrypt } from '../../lib/automation/encryption';

/**
 * Get all available integrations with connection status
 */
export async function GET(request) {
    try {
        const user = await requireAuth(request);

        // Get all integrations
        const integrations = getAllIntegrations();

        // Get connected integrations for this org
        const connected = await query(
            `SELECT integration_name, created_at, updated_at 
             FROM integration_credentials 
             WHERE org_id = $1`,
            [user.org_id]
        );

        const connectedMap = {};
        connected.rows.forEach(row => {
            connectedMap[row.integration_name] = {
                connected: true,
                connectedAt: row.created_at,
                updatedAt: row.updated_at
            };
        });

        // Merge connection status
        const integrationsWithStatus = integrations.map(integration => ({
            ...integration,
            ...connectedMap[integration.id],
            connected: !!connectedMap[integration.id]
        }));

        return NextResponse.json({ integrations: integrationsWithStatus });
    } catch (error) {
        console.error('Get integrations error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch integrations' },
            { status: 500 }
        );
    }
}
