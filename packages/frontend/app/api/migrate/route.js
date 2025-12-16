import { NextResponse } from 'next/server';
import { query } from '@/utils/db';

export async function POST(request) {
    try {
        // Add max_users column to organisations table
        await query(`
      ALTER TABLE organisations 
      ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5
    `);

        return NextResponse.json({
            success: true,
            message: 'Added max_users column to organisations table'
        });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
