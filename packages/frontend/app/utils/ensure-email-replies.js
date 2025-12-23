import { query } from './db';

let ensured = false;
let ensuringPromise = null;

export async function ensureEmailRepliesTable() {
    if (ensured) {
        return;
    }

    if (ensuringPromise) {
        await ensuringPromise;
        return;
    }

    ensuringPromise = query(`
        CREATE TABLE IF NOT EXISTS email_replies (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            reply_to_message_id UUID REFERENCES email_messages(id) ON DELETE CASCADE,
            subject VARCHAR(500),
            body TEXT NOT NULL,
            sent_via VARCHAR(50),
            external_message_id TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            sent_at TIMESTAMPTZ DEFAULT NOW()
        )
    `)
        .then(() => {
            ensured = true;
        })
        .catch((error) => {
            console.error('Failed to ensure email_replies table:', error);
            throw error;
        })
        .finally(() => {
            ensuringPromise = null;
        });

    await ensuringPromise;
}
