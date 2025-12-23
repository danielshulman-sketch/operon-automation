import { NextResponse } from 'next/server';
import { query, getClient } from '@/utils/db';
import { requireSuperAdmin, hashPassword } from '@/utils/auth';

// Get all users in a specific organization
export async function GET(request, { params }) {
    try {
        await requireSuperAdmin(request);
        const { id: orgId } = params;

        // Get organization info
        const orgInfo = await query(
            `SELECT id, name, max_users, created_at FROM organisations WHERE id = $1`,
            [orgId]
        );

        if (orgInfo.rows.length === 0) {
            return NextResponse.json(
                { error: 'Organization not found' },
                { status: 404 }
            );
        }

        // Get all users in the organization with stats
        const result = await query(
            `SELECT 
                u.id, u.email, u.first_name, u.last_name, u.created_at,
                om.role, om.is_admin, om.is_active, om.joined_at,
                COUNT(DISTINCT d.id) FILTER (WHERE d.created_at > NOW() - INTERVAL '7 days') as drafts_7d,
                COUNT(DISTINCT t.id) as tasks_count,
                COUNT(DISTINCT a.id) FILTER (WHERE a.created_at > NOW() - INTERVAL '7 days') as actions_7d
            FROM users u
            JOIN org_members om ON u.id = om.user_id
            LEFT JOIN email_drafts d ON u.id = d.user_id
            LEFT JOIN detected_tasks t ON u.id = t.user_id AND t.status != 'completed'
            LEFT JOIN user_activity a ON u.id = a.user_id
            WHERE om.org_id = $1
            GROUP BY u.id, om.role, om.is_admin, om.is_active, om.joined_at
            ORDER BY om.joined_at DESC`,
            [orgId]
        );

        return NextResponse.json({
            organization: orgInfo.rows[0],
            users: result.rows,
            currentUserCount: result.rows.filter(u => u.is_active).length,
        });
    } catch (error) {
        console.error('Get organization users error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch users' },
            { status: error.message === 'Superadmin access required' ? 403 : 500 }
        );
    }
}

// Create a new user in a specific organization
export async function POST(request, { params }) {
    const client = await getClient();

    try {
        const superadmin = await requireSuperAdmin(request);
        const { id: orgId } = params;
        const { email, password, firstName, lastName, role, isAdmin } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        await client.query('BEGIN');

        // Check organization exists and user limit
        const orgCheck = await client.query(
            `SELECT o.id, o.name, o.max_users, COUNT(om.id) as current_users
             FROM organisations o
             LEFT JOIN org_members om ON o.id = om.org_id AND om.is_active = true
             WHERE o.id = $1
             GROUP BY o.id, o.name, o.max_users`,
            [orgId]
        );

        if (orgCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json(
                { error: 'Organization not found' },
                { status: 404 }
            );
        }

        const { name: orgName, max_users, current_users } = orgCheck.rows[0];
        if (parseInt(current_users) >= parseInt(max_users)) {
            await client.query('ROLLBACK');
            return NextResponse.json(
                { error: `User limit reached. This organization is limited to ${max_users} users.` },
                { status: 403 }
            );
        }

        // Check if user already exists
        const existingUser = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        let userId;
        if (existingUser.rows.length > 0) {
            userId = existingUser.rows[0].id;

            // Check if user is already in this organization
            const existingMember = await client.query(
                'SELECT id FROM org_members WHERE org_id = $1 AND user_id = $2',
                [orgId, userId]
            );

            if (existingMember.rows.length > 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { error: 'User is already a member of this organization' },
                    { status: 400 }
                );
            }
        } else {
            // Create new user
            const passwordHash = await hashPassword(password);
            const userResult = await client.query(
                `INSERT INTO users (email, first_name, last_name)
                 VALUES ($1, $2, $3)
                 RETURNING id`,
                [email, firstName || null, lastName || null]
            );
            userId = userResult.rows[0].id;

            // Create auth account
            await client.query(
                `INSERT INTO auth_accounts (user_id, provider, password_hash)
                 VALUES ($1, 'email', $2)`,
                [userId, passwordHash]
            );
        }

        // Add user to organization
        await client.query(
            `INSERT INTO org_members (org_id, user_id, role, is_admin, is_active)
             VALUES ($1, $2, $3, $4, true)`,
            [orgId, userId, role || 'member', isAdmin || false]
        );

        // Log activity
        await client.query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
             VALUES ($1, $2, 'user_created', $3)`,
            [orgId, userId, `Superadmin added user ${email} to organization ${orgName}`]
        );

        await client.query('COMMIT');

        return NextResponse.json({
            success: true,
            user: {
                id: userId,
                email,
                firstName: firstName || null,
                lastName: lastName || null,
                role: role || 'member',
                isAdmin: isAdmin || false,
            },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create user in organization error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create user' },
            { status: error.message === 'Superadmin access required' ? 403 : 500 }
        );
    } finally {
        client.release();
    }
}

export async function PUT(request, { params }) {
    try {
        await requireSuperAdmin(request);
        const { id: orgId } = params;
        const { userId, newPassword } = await request.json();

        if (!userId || !newPassword) {
            return NextResponse.json(
                { error: 'User ID and new password are required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        const passwordHash = await hashPassword(newPassword);

        // Update password
        await query(
            `UPDATE auth_accounts 
             SET password_hash = $1
             WHERE user_id = $2 AND provider = 'email'`,
            [passwordHash, userId]
        );

        // Log activity
        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
             VALUES ($1, $2, 'password_reset', $3)`,
            [orgId, userId, `Superadmin reset password`]
        );

        return NextResponse.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to reset password' },
            { status: error.message === 'Superadmin access required' ? 403 : 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        await requireSuperAdmin(request);
        const { id: orgId } = params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Get user email for logging
        const userResult = await query(
            'SELECT email FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const userEmail = userResult.rows[0].email;

        // Remove user from organization
        await query(
            'DELETE FROM org_members WHERE org_id = $1 AND user_id = $2',
            [orgId, userId]
        );

        return NextResponse.json({
            success: true,
            message: `User ${userEmail} removed from organization`
        });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete user' },
            { status: error.message === 'Superadmin access required' ? 403 : 500 }
        );
    }
}
