import { query } from './db';

let ensured = false;
let ensuringPromise = null;

export async function ensureAutoDraftSettingsTable() {
    if (ensured) {
        return;
    }

    if (ensuringPromise) {
        await ensuringPromise;
        return;
    }

    ensuringPromise = query(`
        CREATE TABLE IF NOT EXISTS user_auto_draft_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            enabled BOOLEAN DEFAULT false,
            categories JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id)
        )
    `)
        .then(() => {
            ensured = true;
        })
        .catch((error) => {
            console.error('Failed to ensure user_auto_draft_settings table:', error);
            throw error;
        })
        .finally(() => {
            ensuringPromise = null;
        });

    await ensuringPromise;
}
