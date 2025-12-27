import { NextResponse } from 'next/server';
import { query, getClient } from '@/utils/db';
import { requireSuperAdmin } from '@/utils/auth';
import { hashPassword } from '@/utils/auth';

// Get all organizations
export async function GET(request) {
    try {
        const user = await requireSuperAdmin(request);

        const result = await query(
            `SELECT o.*,
        (SELECT COUNT(*) FROM org_members WHERE org_id = o.id) as total_user_count,
        (SELECT COUNT(*) FROM org_members WHERE org_id = o.id AND is_active = true) as active_user_count,
        (SELECT COUNT(*) FROM org_members WHERE org_id = o.id AND is_active = false) as inactive_user_count,
        (SELECT COUNT(*) FROM detected_tasks WHERE org_id = o.id AND status != 'completed') as task_count
       FROM organisations o
       ORDER BY o.created_at DESC`
        );

        return NextResponse.json({ organizations: result.rows });
    } catch (error) {
        console.error('Get organizations error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch organizations' },
            { status: error.message === 'Superadmin access required' ? 403 : 500 }
        );
    }
}

// Create new organization
export async function POST(request) {
    const client = await getClient();

    try {
        const superadmin = await requireSuperAdmin(request);
        const { name, maxUsers, adminEmail, adminPassword, adminFirstName, adminLastName } = await request.json();

        if (!name || !adminEmail || !adminPassword) {
            return NextResponse.json(
                { error: 'Organization name, admin email, and password are required' },
                { status: 400 }
            );
        }

        await client.query('BEGIN');

        // Create organization with max_users
        const orgResult = await client.query(
            `INSERT INTO organisations (name, max_users) VALUES ($1, $2) RETURNING id`,
            [name, maxUsers || 5]
        );
        const orgId = orgResult.rows[0].id;

        // Check if admin user already exists
        const existingUser = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [adminEmail]
        );

        let userId;
        if (existingUser.rows.length > 0) {
            userId = existingUser.rows[0].id;
        } else {
            // Create admin user
            const hashedPassword = await hashPassword(adminPassword);
            const userResult = await client.query(
                `INSERT INTO users (email, first_name, last_name) 
         VALUES ($1, $2, $3) RETURNING id`,
                [adminEmail, adminFirstName || null, adminLastName || null]
            );
            userId = userResult.rows[0].id;

            // Create auth account
            await client.query(
                `INSERT INTO auth_accounts (user_id, provider, password_hash)
         VALUES ($1, 'email', $2)`,
                [userId, hashedPassword]
            );
        }

        // Add user as org admin
        await client.query(
            `INSERT INTO org_members (org_id, user_id, role, is_admin, is_active)
       VALUES ($1, $2, 'admin', true, true)`,
            [orgId, userId]
        );

        // Log activity
        await client.query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
       VALUES ($1, $2, 'organization_created', $3)`,
            [orgId, userId, `Organization "${name}" created by superadmin`]
        );

        await client.query('COMMIT');

        return NextResponse.json({
            success: true,
            organization: { id: orgId, name },
            admin: { id: userId, email: adminEmail },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create organization error:', error);
        return NextResponse.json(
            { error: 'Failed to create organization' },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}

export async function DELETE(request) {
    try {
        await requireSuperAdmin(request);
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');

        if (!orgId) {
            return NextResponse.json(
                { error: 'Organization ID is required' },
                { status: 400 }
            );
        }

        // Get organization name for logging
        const orgResult = await query(
            'SELECT name FROM organisations WHERE id = $1',
            [orgId]
        );

        if (orgResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Organization not found' },
                { status: 404 }
            );
        }

        const orgName = orgResult.rows[0].name;

        // Delete organization (cascade will handle all related records)
        await query('DELETE FROM organisations WHERE id = $1', [orgId]);

        return NextResponse.json({
            success: true,
            message: `Organization "${orgName}" deleted successfully`
        });
    } catch (error) {
        console.error('Delete organization error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete organization' },
            { status: error.message === 'Superadmin access required' ? 403 : 500 }
        );
    }
}

