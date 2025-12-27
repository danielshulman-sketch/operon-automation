import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { generateToken } from '@/utils/auth';

export async function POST(request) {
    try {
        // First check current state
        const before = await query(
            `SELECT id, email, 
       CASE WHEN column_name IS NULL THEN 'column_missing' ELSE 'column_exists' END as column_status
       FROM users u
       LEFT JOIN information_schema.columns c ON c.table_name = 'users' AND c.column_name = 'is_superadmin'
       WHERE u.email = 'daniel@easy-ai.co.uk'
       LIMIT 1`
        );

        // Try to add column
        try {
            await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT false`);
        } catch (e) {
            console.log('Column might already exist:', e.message);
        }

        // Update using explicit TRUE
        const update = await query(
            `UPDATE users SET is_superadmin = TRUE WHERE email = 'daniel@easy-ai.co.uk' RETURNING *`
        );

        // Check after
        const after = await query(
            `SELECT id, email, is_superadmin FROM users WHERE email = 'daniel@easy-ai.co.uk'`
        );

        // Generate JWT token for the superadmin user
        const user = after.rows[0];
        const token = user ? generateToken({ userId: user.id, email: user.email }) : null;

        return NextResponse.json({
            before: before.rows,
            updated: update.rows,
            after: after.rows,
            token: token, // Include the JWT token in the response
            message: token ? 'Superadmin access granted! Use the token to authenticate.' : 'User not found'
        });
    } catch (error) {
        console.error('Force update error:', error);
        return NextResponse.json(
            { error: error.message, stack: error.stack },
            { status: 500 }
        );
    }
}
