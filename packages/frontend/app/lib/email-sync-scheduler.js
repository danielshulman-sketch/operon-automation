import cron from 'node-cron';
import { query } from '@/utils/db';
import { ensureEmailSyncSettingsTable } from '@/utils/ensure-email-sync-settings';
import { syncMailboxesForUser } from './email-sync';

let isRunning = false;

const shouldRun = (lastRunAt, intervalMinutes) => {
    if (!intervalMinutes) return false;
    if (!lastRunAt) return true;
    const last = new Date(lastRunAt).getTime();
    return Date.now() - last >= intervalMinutes * 60 * 1000;
};

async function processAutoSync() {
    await ensureEmailSyncSettingsTable();
    const settingsResult = await query(
        `SELECT user_id, org_id, interval_minutes, last_run_at
         FROM user_email_sync_settings
         WHERE enabled = true`
    );

    for (const setting of settingsResult.rows) {
        if (!shouldRun(setting.last_run_at, setting.interval_minutes)) {
            continue;
        }

        try {
            const userResult = await query(
                `SELECT id, org_id, email
                 FROM users
                 WHERE id = $1`,
                [setting.user_id]
            );

            if (userResult.rows.length === 0) {
                continue;
            }

            const user = userResult.rows[0];
            await syncMailboxesForUser(user);

            await query(
                `UPDATE user_email_sync_settings
                 SET last_run_at = NOW()
                 WHERE user_id = $1 AND org_id = $2`,
                [setting.user_id, setting.org_id]
            );
        } catch (error) {
            console.error('Auto email sync failed:', error);
        }
    }
}

export function initEmailSyncScheduler() {
    if (isRunning) {
        return;
    }

    isRunning = true;
    cron.schedule('* * * * *', async () => {
        try {
            await processAutoSync();
        } catch (error) {
            console.error('Email sync scheduler error:', error);
        }
    });
}
