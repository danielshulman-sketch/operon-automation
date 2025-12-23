import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { hashPassword } from '@/utils/auth';

export async function POST(request) {
    try {
        const { email, newPassword, secret } = await request.json();

        // Simple security check
        if (secret !== 'reset-my-password-please') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find user
        const userResult = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userId = userResult.rows[0].id;

        // Hash the new password
        const passwordHash = await hashPassword(newPassword);

        // Update password
        await query(
            `UPDATE auth_accounts 
             SET password_hash = $1 
             WHERE user_id = $2 AND provider = 'email'`,
            [passwordHash, userId]
        );

        return NextResponse.json({
            success: true,
            message: `Password updated for ${email}`
        });
    } catch (error) {
        console.error('Password reset error:', error);
        return NextResponse.json(
            { error: 'Failed to reset password', details: error.message },
            { status: 500 }
        );
    }
}
