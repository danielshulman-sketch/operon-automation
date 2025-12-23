import { query } from './db';

/**
 * Ensures the assigned_to column exists in the detected_tasks table
 * This is a runtime migration helper
 */
export async function ensureDetectedTasksAssignedColumn() {
    try {
        // Check if column exists
        const checkResult = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'detected_tasks' 
            AND column_name = 'assigned_to'
        `);

        if (checkResult.rows.length === 0) {
            // Column doesn't exist, create it
            console.log('Creating assigned_to column in detected_tasks table...');

            await query(`
                ALTER TABLE detected_tasks 
                ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL
            `);

            // Add index for performance
            await query(`
                CREATE INDEX IF NOT EXISTS idx_detected_tasks_assigned 
                ON detected_tasks(assigned_to) 
                WHERE assigned_to IS NOT NULL
            `);

            console.log('assigned_to column created successfully');
        }
    } catch (error) {
        console.error('Error ensuring assigned_to column:', error);
        // Don't throw - allow the app to continue even if migration fails
    }
}
