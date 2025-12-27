import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { query } from '@/utils/db';
import { decryptValue } from '@/lib/automation/encryption';
import { ensureIntegrationCredentialsTable } from '@/utils/ensure-integration-credentials';

// Import integrations
import { slackIntegration } from '@/lib/integrations/slack';
import { googleSheetsIntegration } from '@/lib/integrations/google-sheets';
import { notionIntegration } from '@/lib/integrations/notion';
import { airtableIntegration } from '@/lib/integrations/airtable';
import { stripeIntegration } from '@/lib/integrations/stripe';
import { emailIntegration } from '@/lib/integrations/email';
import { kartraIntegration } from '@/lib/integrations/kartra';
import { mailerliteIntegration } from '@/lib/integrations/mailerlite';
import { mailchimpIntegration } from '@/lib/integrations/mailchimp';

const INTEGRATIONS = {
    slack: slackIntegration,
    google_sheets: googleSheetsIntegration,
    notion: notionIntegration,
    airtable: airtableIntegration,
    stripe: stripeIntegration,
    email: emailIntegration,
    kartra: kartraIntegration,
    mailerlite: mailerliteIntegration,
    mailchimp: mailchimpIntegration
};

export async function GET(request, { params }) {
    try {
        const user = await requireAuth(request);
        const { name } = params;
        await ensureIntegrationCredentialsTable();

        // Get credentials for this integration
        const credResult = await query(
            'SELECT credentials FROM integration_credentials WHERE org_id = $1 AND integration_name = $2',
            [user.org_id, name]
        );

        if (credResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Integration not connected' },
                { status: 404 }
            );
        }

        // Get integration
        const integration = INTEGRATIONS[name];
        if (!integration) {
            return NextResponse.json(
                { error: 'Unknown integration' },
                { status: 404 }
            );
        }

        // Check if integration supports stats
        if (!integration.get_stats) {
            return NextResponse.json(
                { error: 'Statistics not available for this integration' },
                { status: 404 }
            );
        }

        // Decrypt credentials
        const encryptedCreds = credResult.rows[0].credentials;
        const credentials = JSON.parse(decryptValue(encryptedCreds));

        // Fetch stats
        const stats = await integration.get_stats(credentials);

        return NextResponse.json({ stats });

    } catch (error) {
        console.error('Integration stats error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch integration statistics', details: error.message },
            { status: 500 }
        );
    }
}
