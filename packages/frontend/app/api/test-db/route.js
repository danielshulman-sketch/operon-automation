import { NextResponse } from 'next/server';
import { query } from '@/utils/db';

export async function GET(request) {
    try {
        // Test database connection
        const result = await query('SELECT NOW() as current_time');

        return NextResponse.json({
            success: true,
            message: 'Database connection successful',
            timestamp: result.rows[0].current_time
        });
    } catch (error) {
        console.error('Database test error:', error);
        return NextResponse.json(
            {
                error: 'Database connection failed',
                details: error.message,
                code: error.code
            },
            { status: 500 }
        );
    }
}
