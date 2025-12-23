import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { verifyPassword, generateToken } from '@/utils/auth';
import { ensureSuperadminColumn } from '@/utils/ensure-superadmin-column';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        await ensureSuperadminColumn();

        // Get user with auth account
        const result = await query(
            `SELECT u.id, u.email, u.first_name, u.last_name, 
              COALESCE(u.is_superadmin, false) as is_superadmin,
              a.password_hash, om.org_id, om.role, om.is_admin, om.is_active
       FROM users u
       JOIN auth_accounts a ON u.id = a.user_id
       JOIN org_members om ON u.id = om.user_id
       WHERE u.email = $1 AND a.provider = 'email'
       LIMIT 1`,
            [email]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        const user = result.rows[0];

        // Check if user is active
        if (!user.is_active) {
            return NextResponse.json(
                { error: 'Account is inactive' },
                { status: 403 }
            );
        }

        // Verify password
        const isValid = await verifyPassword(user.password_hash, password);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Log activity
        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
       VALUES ($1, $2, 'user_signin', $3)`,
            [user.org_id, user.id, `User ${email} signed in`]
        );

        // Generate token
        const token = generateToken({ userId: user.id, orgId: user.org_id });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                isAdmin: user.is_admin,
                isSuperadmin: user.is_superadmin,
            },
            token,
        });
    } catch (error) {
        console.error('Signin error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            name: error.name
        });
        return NextResponse.json(
            { error: 'Failed to sign in', details: error.message },
            { status: 500 }
        );
    }
}
