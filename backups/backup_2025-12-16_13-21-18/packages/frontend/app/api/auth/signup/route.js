import { NextResponse } from 'next/server';
import { query, getClient } from '@/utils/db';
import { hashPassword, generateToken } from '@/utils/auth';

export async function POST(request) {
    try {
        const { email, password, firstName, lastName } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Check if this is the first user
        const userCount = await query('SELECT COUNT(*) as count FROM users');
        const isFirstUser = parseInt(userCount.rows[0].count) === 0;

        const client = await getClient();

        try {
            await client.query('BEGIN');

            // Create user
            const userResult = await client.query(
                `INSERT INTO users (email, first_name, last_name)
         VALUES ($1, $2, $3)
         RETURNING id, email, first_name, last_name, created_at`,
                [email, firstName || null, lastName || null]
            );

            const user = userResult.rows[0];

            // Create auth account
            await client.query(
                `INSERT INTO auth_accounts (user_id, provider, password_hash)
         VALUES ($1, 'email', $2)`,
                [user.id, passwordHash]
            );

            // Create organization for first user or get existing org
            let orgId;
            if (isFirstUser) {
                const orgResult = await client.query(
                    `INSERT INTO organisations (name)
           VALUES ($1)
           RETURNING id`,
                    [`${email}'s Organization`]
                );
                orgId = orgResult.rows[0].id;
            } else {
                // For demo purposes, add to first organization
                // In production, you'd have proper org invitation flow
                const orgResult = await client.query(
                    'SELECT id FROM organisations ORDER BY created_at ASC LIMIT 1'
                );
                orgId = orgResult.rows[0].id;
            }

            // Add user to organization
            await client.query(
                `INSERT INTO org_members (org_id, user_id, role, is_admin, is_active)
         VALUES ($1, $2, $3, $4, true)`,
                [orgId, user.id, isFirstUser ? 'admin' : 'member', isFirstUser]
            );

            // Log activity
            await client.query(
                `INSERT INTO user_activity (org_id, user_id, activity_type, description)
         VALUES ($1, $2, 'user_created', $3)`,
                [orgId, user.id, `User ${email} signed up`]
            );

            await client.query('COMMIT');

            // Generate token
            const token = generateToken({ userId: user.id, orgId });

            return NextResponse.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                },
                token,
                isFirstUser,
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Failed to create account' },
            { status: 500 }
        );
    }
}
