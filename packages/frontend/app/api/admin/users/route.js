import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAdmin, requireAuth, hashPassword } from '@/utils/auth';

export async function GET(request) {
    try {
        const user = await requireAdmin(request);

        // Get organization info
        const orgInfo = await query(
            `SELECT id, name, max_users FROM organisations WHERE id = $1`,
            [user.org_id]
        );

        // Get all users in the organization with stats
        const result = await query(
            `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.created_at,
        om.role, om.is_admin, om.is_active,
        COUNT(DISTINCT d.id) FILTER (WHERE d.created_at > NOW() - INTERVAL '7 days') as drafts_7d,
        COUNT(DISTINCT t.id) as tasks_count,
        COUNT(DISTINCT a.id) FILTER (WHERE a.created_at > NOW() - INTERVAL '7 days') as actions_7d
       FROM users u
       JOIN org_members om ON u.id = om.user_id
       LEFT JOIN email_drafts d ON u.id = d.user_id
       LEFT JOIN detected_tasks t ON u.id = t.user_id AND t.status != 'completed'
       LEFT JOIN user_activity a ON u.id = a.user_id
       WHERE om.org_id = $1
       GROUP BY u.id, om.role, om.is_admin, om.is_active
       ORDER BY u.created_at DESC`,
            [user.org_id]
        );

        return NextResponse.json({
            users: result.rows,
            organization: orgInfo.rows[0],
            currentUserCount: result.rows.length,
        });
    } catch (error) {
        if (error.message === 'Admin access required') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }
        console.error('Get users error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const admin = await requireAdmin(request);
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

        // Check organization user limit
        const orgCheck = await query(
            `SELECT o.max_users, COUNT(om.id) as current_users
             FROM organisations o
             LEFT JOIN org_members om ON o.id = om.org_id AND om.is_active = true
             WHERE o.id = $1
             GROUP BY o.id, o.max_users`,
            [admin.org_id]
        );

        const { max_users, current_users } = orgCheck.rows[0];
        if (parseInt(current_users) >= parseInt(max_users)) {
            return NextResponse.json(
                { error: `User limit reached. Your organization is limited to ${max_users} users. Please upgrade your subscription.` },
                { status: 403 }
            );
        }

        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        let user;
        let userId;

        if (existingUser.rows.length > 0) {
            userId = existingUser.rows[0].id;

            // Ensure user isn't already in this organization
            const membershipCheck = await query(
                `SELECT id FROM org_members WHERE org_id = $1 AND user_id = $2`,
                [admin.org_id, userId]
            );

            if (membershipCheck.rows.length > 0) {
                return NextResponse.json(
                    { error: 'User is already part of this organization' },
                    { status: 400 }
                );
            }

            if (password) {
                if (password.length < 8) {
                    return NextResponse.json(
                        { error: 'Password must be at least 8 characters' },
                        { status: 400 }
                    );
                }

                const passwordHash = await hashPassword(password);
                await query(
                    `UPDATE auth_accounts 
                     SET password_hash = $1
                     WHERE user_id = $2 AND provider = 'email'`,
                    [passwordHash, userId]
                );
            }

            const userInfo = await query(
                `SELECT id, email, first_name, last_name FROM users WHERE id = $1`,
                [userId]
            );
            user = userInfo.rows[0];
        } else {
            if (!password || password.length < 8) {
                return NextResponse.json(
                    { error: 'Password must be at least 8 characters' },
                    { status: 400 }
                );
            }

            const passwordHash = await hashPassword(password);

            const userResult = await query(
                `INSERT INTO users (email, first_name, last_name)
                 VALUES ($1, $2, $3)
                 RETURNING id, email, first_name, last_name, created_at`,
                [email, firstName || null, lastName || null]
            );

            user = userResult.rows[0];
            userId = user.id;

            await query(
                `INSERT INTO auth_accounts (user_id, provider, password_hash)
                 VALUES ($1, 'email', $2)`,
                [userId, passwordHash]
            );
        }

        await query(
            `INSERT INTO org_members (org_id, user_id, role, is_admin, is_active)
             VALUES ($1, $2, $3, $4, true)`,
            [admin.org_id, userId, role || 'member', isAdmin || false]
        );

        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
             VALUES ($1, $2, 'user_created', $3)`,
            [admin.org_id, admin.id, `Admin added user ${email} to organization`]
        );

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: role || 'member',
                isAdmin: isAdmin || false,
            },
        });
    } catch (error) {
        if (error.message === 'Admin access required') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }
        console.error('Create user error:', error);
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const admin = await requireAdmin(request);
        const { userId, isActive, newPassword } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Handle password reset
        if (newPassword !== undefined) {
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
                [admin.org_id, admin.id, `Admin reset password for user`]
            );

            return NextResponse.json({ success: true, message: 'Password reset successfully' });
        }

        // Handle status update
        if (isActive !== undefined) {
            await query(
                `UPDATE org_members 
                 SET is_active = $1
                 WHERE org_id = $2 AND user_id = $3`,
                [isActive, admin.org_id, userId]
            );

            // Log activity
            await query(
                `INSERT INTO user_activity (org_id, user_id, activity_type, description)
                 VALUES ($1, $2, 'user_status_changed', $3)`,
                [admin.org_id, admin.id, `User ${isActive ? 'activated' : 'deactivated'}`]
            );

            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { error: 'No valid update parameters provided' },
            { status: 400 }
        );
    } catch (error) {
        if (error.message === 'Admin access required') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }
        console.error('Update user error:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const admin = await requireAdmin(request);
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Verify user belongs to admin's organization
        const userCheck = await query(
            `SELECT u.email FROM users u
             JOIN org_members om ON u.id = om.user_id
             WHERE u.id = $1 AND om.org_id = $2`,
            [userId, admin.org_id]
        );

        if (userCheck.rows.length === 0) {
            return NextResponse.json(
                { error: 'User not found in your organization' },
                { status: 404 }
            );
        }

        const userEmail = userCheck.rows[0].email;

        // Remove user from organization (cascade will handle related records)
        await query(
            `DELETE FROM org_members WHERE org_id = $1 AND user_id = $2`,
            [admin.org_id, userId]
        );

        // Log activity
        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
             VALUES ($1, $2, 'user_deleted', $3)`,
            [admin.org_id, admin.id, `Admin removed user: ${userEmail}`]
        );

        return NextResponse.json({ success: true, message: 'User removed from organization' });
    } catch (error) {
        if (error.message === 'Admin access required') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }
        console.error('Delete user error:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
