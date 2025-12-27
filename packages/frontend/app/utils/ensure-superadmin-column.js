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
            console.log('is_superadmin column ensured');
        })
        .catch((error) => {
            // Don't throw - column might already exist or other transient error
            // Log the error but mark as ensured to prevent repeated failures
            console.log('is_superadmin column already exists or error:', error.message);
            ensured = true;
        })
        .finally(() => {
            ensuringPromise = null;
        });

    await ensuringPromise;
}
