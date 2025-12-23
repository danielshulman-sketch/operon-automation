import { query } from './db';

let ensured = false;
let ensuringPromise = null;

export async function ensureIntegrationCredentialsTable() {
    if (ensured) {
        return;
    }

    if (ensuringPromise) {
        await ensuringPromise;
        return;
    }

    ensuringPromise = query(`
        CREATE TABLE IF NOT EXISTS integration_credentials (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
            integration_name VARCHAR(100) NOT NULL,
            credentials TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(org_id, integration_name)
        )
    `)
        .then(async () => {
            const result = await query(
                `SELECT data_type, udt_name
                 FROM information_schema.columns
                 WHERE table_name = 'integration_credentials'
                   AND column_name = 'credentials'
                 LIMIT 1`
            );

            const column = result.rows[0];
            if (column && column.udt_name === 'jsonb') {
                await query(
                    `ALTER TABLE integration_credentials
                     ALTER COLUMN credentials TYPE TEXT
                     USING credentials::text`
                );
            }

            ensured = true;
        })
        .catch((error) => {
            console.error('Failed to ensure integration_credentials table:', error);
            throw error;
        })
        .finally(() => {
            ensuringPromise = null;
        });

    await ensuringPromise;
}
