import { NextResponse } from 'next/server';
import { getIntegration } from '@/lib/integrations';
import { query } from '@/utils/db';
import { encrypt } from '@/lib/automation/encryption';
import { cookies } from 'next/headers';
import { getUserFromToken } from '@/utils/auth';
import { ensureIntegrationCredentialsTable } from '@/utils/ensure-integration-credentials';
import { ensureOAuthClientCredentialsTable } from '@/utils/ensure-oauth-client-credentials';
import { decryptValue } from '@/lib/automation/encryption';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const stateParam = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/automations/integrations?error=${error}`);
        }

        if (!code || !stateParam) {
            return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
        }

        let state;
        try {
            state = JSON.parse(stateParam);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
        }

        const integrationName = state.integration;
        const integration = getIntegration(integrationName);

        if (!integration) {
            return NextResponse.json({ error: 'Invalid integration' }, { status: 400 });
        }

        // 1. Verify User from Cookie
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?redirect=${encodeURIComponent(request.url)}`);
        }

        const user = await getUserFromToken(token);
        if (!user) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?redirect=${encodeURIComponent(request.url)}`);
        }

        // 2. Exchange Code for Token
        let clientId = process.env[`${integrationName.toUpperCase()}_CLIENT_ID`];
        let clientSecret = process.env[`${integrationName.toUpperCase()}_CLIENT_SECRET`];

        try {
            await ensureOAuthClientCredentialsTable();
            const oauthResult = await query(
                `SELECT client_id, client_secret
                 FROM oauth_client_credentials
                 WHERE org_id = $1 AND integration_name = $2`,
                [user.org_id, integrationName]
            );
            if (oauthResult.rows.length > 0) {
                clientId = decryptValue(oauthResult.rows[0].client_id);
                clientSecret = decryptValue(oauthResult.rows[0].client_secret);
            }
        } catch (error) {
            console.error('Failed to load OAuth client credentials:', error);
        }
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback`;

        if (!clientId || !clientSecret) {
            console.error('Missing OAuth credentials for', integrationName);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/automations/integrations?error=config_missing`);
        }

        let tokenResponse;
        if (integrationName === 'notion') {
            const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            tokenResponse = await fetch(integration.oauth.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${basicAuth}`,
                },
                body: JSON.stringify({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: redirectUri,
                })
            });
        } else if (integrationName === 'airtable') {
            const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            tokenResponse = await fetch(integration.oauth.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${basicAuth}`,
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: redirectUri
                })
            });
        } else {
            tokenResponse = await fetch(integration.oauth.tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code: code,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUri
                })
            });
        }

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error('Token exchange error:', tokenData);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/automations/integrations?error=token_exchange_failed`);
        }

        // 3. Encrypt & Store Credentials
        const credentials = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expiry_date: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : null,
            scope: tokenData.scope,
            raw: tokenData
        };

        const encrypted = encrypt(JSON.stringify(credentials));

        await ensureIntegrationCredentialsTable();
        await query(
            `INSERT INTO integration_credentials (org_id, integration_name, credentials, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())
             ON CONFLICT (org_id, integration_name) DO UPDATE SET credentials = $3, updated_at = NOW()`,
            [user.org_id, integrationName, encrypted]
        );

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/automations/integrations?success=true`);

    } catch (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/automations/integrations?error=server_error`);
    }
}
