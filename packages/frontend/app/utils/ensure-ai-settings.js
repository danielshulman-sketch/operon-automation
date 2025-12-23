import { query } from './db';

let ensured = false;
let ensuringPromise = null;

export async function ensureAiSettingsTable() {
    if (ensured) {
        return;
    }

    if (ensuringPromise) {
        await ensuringPromise;
        return;
    }

    ensuringPromise = query(`
        CREATE TABLE IF NOT EXISTS org_ai_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
            provider VARCHAR(50) DEFAULT 'openai',
            model VARCHAR(100),
            openai_api_key TEXT,
            anthropic_api_key TEXT,
            google_api_key TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(org_id)
        )
    `)
        .then(() => {
            ensured = true;
        })
        .catch((error) => {
            console.error('Failed to ensure org_ai_settings table:', error);
            throw error;
        })
        .finally(() => {
            ensuringPromise = null;
        });

    await ensuringPromise;
}
