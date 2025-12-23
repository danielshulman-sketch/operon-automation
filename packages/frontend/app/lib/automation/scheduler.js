import cron from 'node-cron';
import { query, getClient } from '@/utils/db';
import { executeAutomation } from './engine';
import { performBackup } from '../backup';
import { emailIntegration } from '../integrations/email';
import { decryptValue } from './encryption';
import { ensureAutomationTables } from '@/utils/ensure-automation-tables';

let isSchedulerRunning = false;

/**
 * Initialize the scheduler
 * This should be called when the server starts (e.g., in instrumentation.js or a separate worker)
 */
export function initScheduler() {
    if (isSchedulerRunning) {
        console.log('Scheduler already running, skipping initialization.');
        return;
    }

    console.log('Initializing automation scheduler...');
    isSchedulerRunning = true;

    // Run every minute to check for scheduled triggers and email triggers
    // In a production serverless env, this would be an external cron triggering an API route
    cron.schedule('* * * * *', async () => {
        try {
            console.log('Running scheduler tick...');
            await processEmailTriggers();
            await processScheduledTriggers();
        } catch (error) {
            console.error('Scheduler error:', error);
        }
    });

    // Run system backup every 30 minutes
    console.log('Scheduling backups (every 30 mins)...');
    cron.schedule('*/30 * * * *', async () => {
        try {
            await performBackup();
        } catch (error) {
            console.error('Scheduled backup error:', error);
        }
    });
}

/**
 * Process "Email Received" triggers
 */
async function processEmailTriggers() {
    const client = await getClient();
    try {
        await ensureAutomationTables();
        // Find active automations with email_received trigger
        const result = await client.query(
            `SELECT id, org_id, trigger_config, steps 
             FROM workflow_definitions 
             WHERE trigger_type = 'email_received' AND is_active = true`
        );

        for (const automation of result.rows) {
            try {
                // Get email credentials for this org
                const credResult = await client.query(
                    `SELECT credentials FROM integration_credentials 
                     WHERE org_id = $1 AND integration_name = 'email'`,
                    [automation.org_id]
                );

                if (credResult.rows.length === 0) continue;

                const encryptedCreds = credResult.rows[0].credentials;
                const credentials = JSON.parse(decryptValue(encryptedCreds));

                // Check for new emails using the integration
                // We need to store the last checked ID/date to avoid duplicates
                // For now, let's assume valid credentials and simplistic check

                // Note: Real world implementation needs a way to persist "last_checked_id" per automation
                // We can use the trigger_config to store this state, or a separate state table

                // Let's use trigger_config to store the last seen UID
                let lastUid = automation.trigger_config?.lastUid || 0;

                const checkResult = await emailIntegration.check_emails(credentials, {
                    // We could pass lastUid here if check_emails supported it natively
                    // For now check_emails returns UNSEEN. 
                    // If we strictly rely on UNSEEN, we rely on the mailbox state.
                });

                if (checkResult.emails && checkResult.emails.length > 0) {
                    // Import email parser for rich data extraction
                    const { extractEmailMetadata } = await import('./email-parser');

                    // Trigger for each new email
                    for (const email of checkResult.emails) {
                        console.log(`Triggering automation ${automation.id} for email ${email.id}`);

                        // Extract rich email data
                        const emailData = extractEmailMetadata(email);

                        // Execute automation with enhanced email context
                        await executeAutomation(
                            `auto_email_${email.id}_${Date.now()}`,
                            automation,
                            { email: emailData },
                            automation.org_id
                        );
                    }
                }

            } catch (err) {
                console.error(`Error processing email trigger for automation ${automation.id}:`, err);
            }
        }
    } finally {
        client.release();
    }
}

/**
 * Process "Scheduled" triggers
 */
async function processScheduledTriggers() {
    const client = await getClient();
    try {
        await ensureAutomationTables();
        // Find active automations with scheduled trigger
        const result = await client.query(
            `SELECT id, org_id, name, trigger_config, steps 
             FROM workflow_definitions 
             WHERE trigger_type = 'scheduled' AND is_active = true`
        );

        for (const automation of result.rows) {
            try {
                const config = typeof automation.trigger_config === 'string'
                    ? JSON.parse(automation.trigger_config)
                    : automation.trigger_config;

                if (!config.cron) continue;

                // Check if it's time to run
                // Note: In a robust system, we'd use a separate table to track next_run_at
                // and minimal polling. For this MVP, we re-validate the cron expression every minute
                // This is inefficient for large scale but fine for MVP foundation.

                // Better approach for MVP: Use cron.validate(config.cron)
                // However, determining if it matches *this specific minute* requires parsing.
                // Since we run this function every minute via the main cron, we just need to know 
                // if the current minute matches the automation's cron expression.

                // Actually, node-cron doesn't easily "check" a string against now.
                // A common pattern for user-defined crons in a single poller is:
                const interval = require('cron-parser');

                try {
                    const intervalObj = interval.parseExpression(config.cron);
                    const now = new Date();
                    const prev = intervalObj.prev();
                    const prevDate = prev.toDate();

                    // If the previous scheduled time was within the last minute, run it.
                    // (Allowing for slight execution delays)
                    const diff = now.getTime() - prevDate.getTime();
                    if (diff < 60000 && diff >= 0) {
                        console.log(`Triggering scheduled automation ${automation.id}`);

                        // Execute automation
                        await executeAutomation(
                            `auto_sched_${automation.id}_${Date.now()}`,
                            automation, // We need full automation object, select above missed 'steps'
                            {
                                time: now.toISOString(),
                                cron: config.cron
                            },
                            automation.org_id
                        );
                    }
                } catch (err) {
                    // Invalid cron or parsing error
                }
            } catch (err) {
                console.error(`Error processing scheduled trigger for ${automation.id}:`, err);
            }
        }
    } finally {
        client.release();
    }
}
