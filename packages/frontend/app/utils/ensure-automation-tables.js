import { query } from './db';

let ensured = false;
let ensuringPromise = null;

export async function ensureAutomationTables() {
    if (ensured) {
        return;
    }

    if (ensuringPromise) {
        await ensuringPromise;
        return;
    }

    ensuringPromise = (async () => {
        await query(`
            CREATE TABLE IF NOT EXISTS workflow_definitions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                trigger_type VARCHAR(100) NOT NULL,
                trigger_config JSONB DEFAULT '{}'::jsonb,
                steps JSONB DEFAULT '[]'::jsonb,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS workflow_runs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
                workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
                status VARCHAR(50) DEFAULT 'running',
                trigger_data JSONB DEFAULT '{}'::jsonb,
                started_at TIMESTAMPTZ DEFAULT NOW(),
                completed_at TIMESTAMPTZ,
                error_message TEXT
            )
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS workflow_run_steps (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                workflow_run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
                step_number INTEGER NOT NULL,
                step_type VARCHAR(100) NOT NULL,
                step_config JSONB DEFAULT '{}'::jsonb,
                status VARCHAR(50) DEFAULT 'pending',
                result JSONB DEFAULT '{}'::jsonb,
                started_at TIMESTAMPTZ,
                completed_at TIMESTAMPTZ,
                error_message TEXT
            )
        `);

        await query(`
            CREATE INDEX IF NOT EXISTS idx_workflow_definitions_org ON workflow_definitions(org_id)
        `);
        await query(`
            CREATE INDEX IF NOT EXISTS idx_workflow_runs_org ON workflow_runs(org_id)
        `);
        await query(`
            CREATE INDEX IF NOT EXISTS idx_workflow_runs_started ON workflow_runs(started_at DESC)
        `);
        await query(`
            CREATE INDEX IF NOT EXISTS idx_workflow_run_steps_run ON workflow_run_steps(workflow_run_id)
        `);

        ensured = true;
    })()
        .catch((error) => {
            console.error('Failed to ensure automation tables:', error);
            throw error;
        })
        .finally(() => {
            ensuringPromise = null;
        });

    await ensuringPromise;
}
