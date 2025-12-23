import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireSuperAdmin } from '@/utils/auth';

export async function POST(request) {
    try {
        await requireSuperAdmin(request);

        // Create integration_credentials table
        await query(`
            CREATE TABLE IF NOT EXISTS integration_credentials (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
                integration_name VARCHAR(100) NOT NULL,
                credentials TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(org_id, integration_name)
            )
        `);

        // Create webhook_endpoints table
        await query(`
            CREATE TABLE IF NOT EXISTS webhook_endpoints (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
                workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
                webhook_url VARCHAR(500) UNIQUE NOT NULL,
                secret_key VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // Create indexes
        await query(`CREATE INDEX IF NOT EXISTS idx_integration_credentials_org ON integration_credentials(org_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_workflow ON webhook_endpoints(workflow_id)`);

        return NextResponse.json({
            success: true,
            message: 'Automation tables created successfully'
        });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json(
            { error: error.message || 'Migration failed' },
            { status: 500 }
        );
    }
}
