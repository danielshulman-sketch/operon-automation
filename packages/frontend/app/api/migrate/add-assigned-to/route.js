import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';

export async function POST(request) {
    try {
        // Allow anyone to run this migration (remove in production!)
        console.log('Running migration to add assigned_to column...');

        // Add assigned_to column if it doesn't exist
        await query(`
            ALTER TABLE detected_tasks 
            ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL
        `);

        // Add index
        await query(`
            CREATE INDEX IF NOT EXISTS idx_detected_tasks_assigned 
            ON detected_tasks(assigned_to) 
            WHERE assigned_to IS NOT NULL
        `);

        return NextResponse.json({
            success: true,
            message: 'Migration completed successfully'
        });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json(
            { error: 'Migration failed', details: error.message },
            { status: 500 }
        );
    }
}
