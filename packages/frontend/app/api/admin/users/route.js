import { NextResponse } from 'next/server';
import { query } from '../../../utils/db';
import { requireAdmin, requireAuth, hashPassword } from '../../../utils/auth';

export async function GET(request) {
    try {
        const user = await requireAdmin(request);

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

        return NextResponse.json({ users: result.rows });
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

        // Create user
        const userResult = await query(
            `INSERT INTO users (email, first_name, last_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, first_name, last_name, created_at`,
            [email, firstName || null, lastName || null]
        );

        const user = userResult.rows[0];

        // Create auth account
        await query(
            `INSERT INTO auth_accounts (user_id, provider, password_hash)
       VALUES ($1, 'email', $2)`,
            [user.id, passwordHash]
        );

        // Add to organization
        await query(
            `INSERT INTO org_members (org_id, user_id, role, is_admin, is_active)
       VALUES ($1, $2, $3, $4, true)`,
            [admin.org_id, user.id, role || 'member', isAdmin || false]
        );

        // Log activity
        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
       VALUES ($1, $2, 'user_created', $3)`,
            [admin.org_id, admin.id, `Admin created user: ${email}`]
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
        const { userId, isActive } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Update user status
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
