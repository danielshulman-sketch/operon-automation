import { NextResponse } from 'next/server';
import { getIntegration, supportsOAuth } from '@/lib/integrations';
import { requireAuth } from '@/utils/auth';
import { query } from '@/utils/db';
import { ensureOAuthClientCredentialsTable } from '@/utils/ensure-oauth-client-credentials';
import { decryptValue } from '@/lib/automation/encryption';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function buildAuthUrl(request, integrationName, clientId) {
    const integration = getIntegration(integrationName);
    if (!integration || !supportsOAuth(integration)) {
        const url = new URL('/dashboard/automations/integrations?error=invalid_integration', request.url);
        return { redirect: url };
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback`;
    const state = JSON.stringify({ integration: integrationName });

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        state: state,
    });

    if (integration.oauth.scopes?.length) {
        params.set('scope', integration.oauth.scopes.join(' '));
    }

    if (integrationName === 'google_sheets') {
        params.set('access_type', 'offline');
        params.set('prompt', 'consent');
    }

    if (integrationName === 'slack') {
        params.set('user_scope', '');
    }

    if (integrationName === 'notion') {
        params.set('owner', 'workspace');
    }

    const url = `${integration.oauth.authUrl}?${params.toString()}`;
    return { url };
}

async function getStoredClientId(orgId, integrationName) {
    await ensureOAuthClientCredentialsTable();
    const result = await query(
        `SELECT client_id FROM oauth_client_credentials
         WHERE org_id = $1 AND integration_name = $2`,
        [orgId, integrationName]
    );
    if (result.rows.length === 0) return null;
    try {
        return decryptValue(result.rows[0].client_id);
    } catch (error) {
        return null;
    }
}

export async function POST(request) {
    try {
        const user = await requireAuth(request);
        const body = await request.json();
        const integrationName = body?.integration;

        if (!integrationName) {
            return NextResponse.json({ error: 'integration is required' }, { status: 400 });
        }

        const storedClientId = await getStoredClientId(user.org_id, integrationName);
        const envClientId = process.env[`${integrationName.toUpperCase()}_CLIENT_ID`];
        const clientId = storedClientId || envClientId;

        if (!clientId) {
            return NextResponse.json({ error: 'Configuration missing (Client ID)' }, { status: 400 });
        }

        const { url, redirect } = await buildAuthUrl(request, integrationName, clientId);
        if (redirect) {
            return NextResponse.json({ error: 'Invalid integration' }, { status: 400 });
        }

        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (token) {
            const cookieStore = cookies();
            cookieStore.set('auth_token', token, { httpOnly: true, sameSite: 'lax', path: '/' });
        }

        return NextResponse.json({ url });
    } catch (error) {
        console.error('OAuth authorize error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const integrationName = searchParams.get('integration');

        if (!integrationName) {
            const url = new URL('/dashboard/automations/integrations?error=integration_required', request.url);
            return NextResponse.redirect(url);
        }

        const envClientId = process.env[`${integrationName.toUpperCase()}_CLIENT_ID`];
        if (!envClientId) {
            const url = new URL(
                `/dashboard/automations/integrations?error=${encodeURIComponent('Configuration missing (Client ID)')}`,
                request.url
            );
            return NextResponse.redirect(url);
        }

        const { url, redirect } = await buildAuthUrl(request, integrationName, envClientId);
        if (redirect) {
            return NextResponse.redirect(redirect);
        }

        return NextResponse.redirect(url);
    } catch (error) {
        console.error('OAuth authorize error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
