import { query } from './db';

let ensured = false;
let ensuringPromise = null;

/**
 * Ensure the users table has an is_superadmin column.
 * Older databases might be missing it which causes auth queries to fail.
 */
export async function ensureSuperadminColumn() {
    if (ensured) {
        return;
    }

    if (ensuringPromise) {
        await ensuringPromise;
        return;
    }

    ensuringPromise = query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT false
    `)
        .then(() => {
            ensured = true;
        })
        .catch((error) => {
            console.error('Failed to ensure is_superadmin column:', error);
            throw error;
        })
        .finally(() => {
            ensuringPromise = null;
        });

    await ensuringPromise;
}
