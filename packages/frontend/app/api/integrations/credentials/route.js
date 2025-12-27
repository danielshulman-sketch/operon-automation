import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { encrypt } from '@/lib/automation/encryption';
import { ensureIntegrationCredentialsTable } from '@/utils/ensure-integration-credentials';

// Save integration credentials
export async function POST(request) {
    try {
        const user = await requireAuth(request);
        await ensureIntegrationCredentialsTable();
        const { integrationName, credentials } = await request.json();

        if (!integrationName || !credentials) {
            return NextResponse.json(
                { error: 'Integration name and credentials are required' },
                { status: 400 }
            );
        }

        // Encrypt credentials
        const encryptedCreds = encrypt(JSON.stringify(credentials));

        // Upsert credentials
        await query(
            `INSERT INTO integration_credentials (org_id, integration_name, credentials)
             VALUES ($1, $2, $3)
             ON CONFLICT (org_id, integration_name)
             DO UPDATE SET credentials = $3, updated_at = NOW()`,
            [user.org_id, integrationName, encryptedCreds]
        );

        return NextResponse.json({
            success: true,
            message: `${integrationName} connected successfully`
        });
    } catch (error) {
        console.error('Save credentials error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save credentials' },
            { status: 500 }
        );
    }
}

// Delete integration credentials
export async function DELETE(request) {
    try {
        const user = await requireAuth(request);
        await ensureIntegrationCredentialsTable();
        const { searchParams } = new URL(request.url);
        const integrationName = searchParams.get('integration');

        if (!integrationName) {
            return NextResponse.json(
                { error: 'Integration name is required' },
                { status: 400 }
            );
        }

        await query(
            `DELETE FROM integration_credentials 
             WHERE org_id = $1 AND integration_name = $2`,
            [user.org_id, integrationName]
        );

        return NextResponse.json({
            success: true,
            message: `${integrationName} disconnected`
        });
    } catch (error) {
        console.error('Delete credentials error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete credentials' },
            { status: 500 }
        );
    }
}
