import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { query } from '@/utils/db';
import { encrypt, decryptValue } from '@/lib/automation/encryption';
import { getAllIntegrations, supportsOAuth } from '@/lib/integrations';
import { ensureOAuthClientCredentialsTable } from '@/utils/ensure-oauth-client-credentials';

export async function GET(request) {
    try {
        const user = await requireAuth(request);
        await ensureOAuthClientCredentialsTable();

        const integrations = getAllIntegrations().filter((integration) => supportsOAuth(integration));
        const existing = await query(
            `SELECT integration_name, client_id, client_secret
             FROM oauth_client_credentials
             WHERE org_id = $1`,
            [user.org_id]
        );

        const existingMap = {};
        existing.rows.forEach(row => {
            try {
                const clientId = decryptValue(row.client_id);
                const clientSecret = decryptValue(row.client_secret);
                existingMap[row.integration_name] = {
                    hasClientId: Boolean(clientId),
                    hasClientSecret: Boolean(clientSecret),
                };
            } catch (error) {
                existingMap[row.integration_name] = {
                    hasClientId: false,
                    hasClientSecret: false,
                };
            }
        });

        const response = integrations.map((integration) => ({
            id: integration.id,
            name: integration.name,
            description: integration.description,
            helpUrl: integration.helpUrl,
            setupInstructions: integration.setupInstructions,
            hasClientId: existingMap[integration.id]?.hasClientId || false,
            hasClientSecret: existingMap[integration.id]?.hasClientSecret || false,
        }));

        return NextResponse.json({ integrations: response });
    } catch (error) {
        console.error('Get OAuth settings error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch OAuth settings' },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const user = await requireAuth(request);
        await ensureOAuthClientCredentialsTable();

        const body = await request.json();
        const integrationName = body?.integrationName;
        const clientId = body?.clientId;
        const clientSecret = body?.clientSecret;

        if (!integrationName || !clientId || !clientSecret) {
            return NextResponse.json(
                { error: 'integrationName, clientId, and clientSecret are required' },
                { status: 400 }
            );
        }

        const encryptedClientId = encrypt(clientId);
        const encryptedClientSecret = encrypt(clientSecret);

        await query(
            `INSERT INTO oauth_client_credentials (org_id, integration_name, client_id, client_secret, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (org_id, integration_name)
             DO UPDATE SET client_id = $3, client_secret = $4, updated_at = NOW()`,
            [user.org_id, integrationName, encryptedClientId, encryptedClientSecret]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Save OAuth settings error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save OAuth settings' },
            { status: 500 }
        );
    }
}
