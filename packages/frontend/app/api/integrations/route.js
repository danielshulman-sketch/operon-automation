import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { getAllIntegrations } from '../../lib/integrations/index';
import { query } from '@/utils/db';
import { ensureIntegrationCredentialsTable } from '@/utils/ensure-integration-credentials';

/**
 * Get all available integrations with connection status
 */
export async function GET(request) {
    try {
        const user = await requireAuth(request);
        await ensureIntegrationCredentialsTable();

        // Get all integrations
        const integrations = getAllIntegrations();

        // Get connected integrations for this org
        // Get connected integrations for this org
        let connectedMap = {};
        try {
            const connected = await query(
                `SELECT integration_name, created_at, updated_at 
                 FROM integration_credentials 
                 WHERE org_id = $1`,
                [user.org_id]
            );

            connected.rows.forEach(row => {
                connectedMap[row.integration_name] = {
                    connected: true,
                    connectedAt: row.created_at,
                    updatedAt: row.updated_at
                };
            });
        } catch (dbError) {
            console.error('Failed to fetch connection status:', dbError);
            // Continue without connection status
        }

        // Merge connection status and OAuth readiness
        const integrationsWithStatus = integrations.map((integration) => {
            let oauthReady = true;
            if (integration.authType === 'oauth2') {
                const prefix = integration.id.toUpperCase();
                const clientId = process.env[`${prefix}_CLIENT_ID`];
                const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
                oauthReady = Boolean(clientId && clientSecret);
            }

            return {
                ...integration,
                ...connectedMap[integration.id],
                connected: !!connectedMap[integration.id],
                oauthReady,
            };
        });

        return NextResponse.json({ integrations: integrationsWithStatus });
    } catch (error) {
        console.error('Get integrations error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch integrations' },
            { status: 500 }
        );
    }
}
