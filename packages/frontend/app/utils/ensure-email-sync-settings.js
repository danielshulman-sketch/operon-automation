import { query } from './db';

let ensured = false;
let ensuringPromise = null;

export async function ensureEmailSyncSettingsTable() {
    if (ensured) {
        return;
    }

    if (ensuringPromise) {
        await ensuringPromise;
        return;
    }

    ensuringPromise = query(`
        CREATE TABLE IF NOT EXISTS user_email_sync_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            enabled BOOLEAN DEFAULT false,
            interval_minutes INTEGER DEFAULT 15,
            last_run_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id)
        )
    `)
        .then(() => {
            ensured = true;
        })
        .catch((error) => {
            console.error('Failed to ensure user_email_sync_settings table:', error);
            throw error;
        })
        .finally(() => {
            ensuringPromise = null;
        });

    await ensuringPromise;
}
