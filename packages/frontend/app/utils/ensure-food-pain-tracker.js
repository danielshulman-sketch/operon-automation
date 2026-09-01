import { query } from './db';

let ensured = false;
let ensuringPromise = null;

export async function ensureFoodPainTrackerTables() {
    if (ensured) {
        return;
    }

    if (ensuringPromise) {
        await ensuringPromise;
        return;
    }

    // Each statement is independently non-fatal: a low-privilege DB role (e.g. one
    // that doesn't own these tables) can fail CREATE INDEX/ALTER-adjacent DDL even
    // though the tables themselves already exist and are perfectly usable. We only
    // need the tables present, not every statement to succeed on every deploy.
    ensuringPromise = (async () => {
        try {
            await query(`
                CREATE TABLE IF NOT EXISTS food_logs (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    image_data TEXT,
                    description TEXT,
                    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
                    ai_analysis JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);
        } catch (error) {
            console.error('Failed to ensure food_logs table:', error.message);
        }

        try {
            await query(`
                CREATE INDEX IF NOT EXISTS idx_food_logs_user_date
                ON food_logs(user_id, log_date)
            `);
        } catch (error) {
            console.error('Failed to ensure idx_food_logs_user_date:', error.message);
        }

        try {
            await query(`
                CREATE TABLE IF NOT EXISTS pain_logs (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    log_date DATE NOT NULL,
                    pain_level INTEGER NOT NULL CHECK (pain_level BETWEEN 0 AND 10),
                    notes TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(user_id, log_date)
                )
            `);
        } catch (error) {
            console.error('Failed to ensure pain_logs table:', error.message);
        }

        try {
            await query(`
                CREATE INDEX IF NOT EXISTS idx_pain_logs_user_date
                ON pain_logs(user_id, log_date)
            `);
        } catch (error) {
            console.error('Failed to ensure idx_pain_logs_user_date:', error.message);
        }
    })()
        .then(() => {
            ensured = true;
        })
        .finally(() => {
            ensuringPromise = null;
        });

    await ensuringPromise;
}
