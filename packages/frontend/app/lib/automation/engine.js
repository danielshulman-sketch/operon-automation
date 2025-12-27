/**
 * Automation Execution Engine
 * Executes automation workflows step by step
 */

import { query, getClient } from '@/utils/db';
import { decryptValue } from './encryption';
import { slackIntegration } from '../integrations/slack';
import { googleSheetsIntegration } from '../integrations/google-sheets';
import { notionIntegration } from '../integrations/notion';
import { airtableIntegration } from '../integrations/airtable';
import { stripeIntegration } from '../integrations/stripe';
import { emailIntegration } from '../integrations/email';
import { kartraIntegration } from '../integrations/kartra';
import { mailerliteIntegration } from '../integrations/mailerlite';
import { mailchimpIntegration } from '../integrations/mailchimp';

const INTEGRATIONS = {
    slack: slackIntegration,
    google_sheets: googleSheetsIntegration,
    notion: notionIntegration,
    airtable: airtableIntegration,
    stripe: stripeIntegration,
    email: emailIntegration,
    kartra: kartraIntegration,
    mailerlite: mailerliteIntegration,
    mailchimp: mailchimpIntegration
};

/**
 * Execute a complete automation workflow
 */
export async function executeAutomation(runId, workflow, triggerData, orgId) {
    const client = await getClient();

    try {
        const steps = typeof workflow.steps === 'string'
            ? JSON.parse(workflow.steps)
            : workflow.steps;

        let context = { trigger: triggerData }; // Data passed between steps

        // Execute each step sequentially
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];

            try {
                // Create step record
                await client.query(
                    `INSERT INTO workflow_run_steps 
                     (workflow_run_id, step_number, step_type, step_config, status, started_at)
                     VALUES ($1, $2, $3, $4, 'running', NOW())`,
                    [runId, i + 1, step.type, JSON.stringify(step.config || {})]
                );

                // Execute step
                const result = await executeStep(step, context, orgId, client);

                // Update step as completed
                await client.query(
                    `UPDATE workflow_run_steps
                     SET status = 'completed',
                         result = $1,
                         completed_at = NOW()
                     WHERE workflow_run_id = $2 AND step_number = $3`,
                    [JSON.stringify(result), runId, i + 1]
                );

                // Add result to context for next step
                context[`step${i + 1}`] = result;

            } catch (stepError) {
                // Mark step as failed
                await client.query(
                    `UPDATE workflow_run_steps
                     SET status = 'failed',
                         error_message = $1,
                         completed_at = NOW()
                     WHERE workflow_run_id = $2 AND step_number = $3`,
                    [stepError.message, runId, i + 1]
                );

                throw stepError; // Stop workflow execution
            }
        }

        // Mark workflow run as completed
        await client.query(
            `UPDATE workflow_runs
             SET status = 'completed',
                 completed_at = NOW()
             WHERE id = $1`,
            [runId]
        );

        return { success: true, context };

    } catch (error) {
        // Mark workflow run as failed
        await client.query(
            `UPDATE workflow_runs
             SET status = 'failed',
                 error_message = $1,
                 completed_at = NOW()
             WHERE id = $2`,
            [error.message, runId]
        );

        throw error;
    } finally {
        client.release();
    }
}

/**
 * Execute individual step
 */
async function executeStep(step, context, orgId, client) {
    const [integrationName, actionName] = step.type.split('_', 2);
    const fullActionName = step.type.substring(integrationName.length + 1);

    // Get integration
    const integration = INTEGRATIONS[integrationName];
    if (!integration) {
        throw new Error(`Unknown integration: ${integrationName}`);
    }

    // Get action
    const action = integration[fullActionName];
    if (!action) {
        throw new Error(`Unknown action: ${fullActionName} for ${integrationName}`);
    }

    // Get credentials
    const credResult = await client.query(
        `SELECT credentials FROM integration_credentials WHERE org_id = $1 AND integration_name = $2`,
        [orgId, integrationName]
    );

    if (credResult.rows.length === 0) {
        throw new Error(`${integration.name} is not connected. Please connect it first.`);
    }

    const encryptedCreds = credResult.rows[0].credentials;
    const credentials = JSON.parse(decryptValue(encryptedCreds));

    // Substitute variables in config
    const config = substituteVariables(step.config, context);

    // Execute action
    return await action(credentials, config, context);
}

/**
 * Substitute variables like {{trigger.field}} with actual values
 */
function substituteVariables(obj, context) {
    if (typeof obj === 'string') {
        return obj.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
            const value = getNestedValue(context, path.trim());
            return value !== undefined ? value : match;
        });
    }

    if (Array.isArray(obj)) {
        return obj.map(item => substituteVariables(item, context));
    }

    if (obj && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = substituteVariables(value, context);
        }
        return result;
    }

    return obj;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}
