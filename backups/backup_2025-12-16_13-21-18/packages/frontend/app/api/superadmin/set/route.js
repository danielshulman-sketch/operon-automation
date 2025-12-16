import { NextResponse } from 'next/server';
import { query } from '@/utils/db';

export async function POST(request) {
    try {
        const { email } = await request.json();

        // First, check if column exists
        const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_superadmin'
    `);

        if (columnCheck.rows.length === 0) {
            // Add column if it doesn't exist
            await query(`ALTER TABLE users ADD COLUMN is_superadmin BOOLEAN DEFAULT false`);
        }

        // Now update the user
        const result = await query(
            `UPDATE users SET is_superadmin = true WHERE email = $1 RETURNING id, email, is_superadmin`,
            [email]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Verify the update
        const verify = await query(
            `SELECT id, email, is_superadmin FROM users WHERE email = $1`,
            [email]
        );

        return NextResponse.json({
            success: true,
            updated: result.rows[0],
            verified: verify.rows[0],
            message: `User ${email} is now a superadmin`,
        });
    } catch (error) {
        console.error('Set superadmin error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
