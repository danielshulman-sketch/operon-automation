import { query } from './db';

export async function ensureOAuthClientCredentialsTable() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS oauth_client_credentials (
                org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
                integration_name TEXT NOT NULL,
                client_id TEXT NOT NULL,
                client_secret TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                PRIMARY KEY (org_id, integration_name)
            )
        `);
    } catch (error) {
        console.error('Failed to ensure oauth_client_credentials table:', error);
    }
}
