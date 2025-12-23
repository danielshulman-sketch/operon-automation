import { NextResponse } from 'next/server';
import { getIntegration } from '../../../../lib/integrations';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const integrationName = searchParams.get('integration');

        if (!integrationName) {
            const url = new URL('/dashboard/automations/integrations?error=integration_required', request.url);
            return NextResponse.redirect(url);
        }

        const integration = getIntegration(integrationName);
        if (!integration || integration.authType !== 'oauth2') {
            const url = new URL('/dashboard/automations/integrations?error=invalid_integration', request.url);
            return NextResponse.redirect(url);
        }

        const clientId = process.env[`${integrationName.toUpperCase()}_CLIENT_ID`];
        if (!clientId) {
            const url = new URL(
                `/dashboard/automations/integrations?error=${encodeURIComponent('Configuration missing (Client ID)')}`,
                request.url
            );
            return NextResponse.redirect(url);
        }

        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback`;
        const state = JSON.stringify({ integration: integrationName }); // Simple state for now

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            state: state,
            scope: integration.oauth.scopes.join(' '),
            access_type: 'offline', // For Google refresh tokens
            prompt: 'consent' // Force consent for refresh tokens
        });

        // Slack specific
        if (integrationName === 'slack') {
            params.set('user_scope', ''); // If needed
        }

        const url = `${integration.oauth.authUrl}?${params.toString()}`;

        return NextResponse.redirect(url);
    } catch (error) {
        console.error('OAuth authorize error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
