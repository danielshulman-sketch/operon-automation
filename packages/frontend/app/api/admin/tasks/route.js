import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAdmin } from '@/utils/auth';
import { ensureDetectedTasksAssignedColumn } from '@/utils/ensure-detected-tasks-columns';

export async function GET(request) {
    try {
        const user = await requireAdmin(request);
        await ensureDetectedTasksAssignedColumn();

        // Get all tasks for the organization with user details
        const result = await query(
            `SELECT 
        t.id, t.title, t.description, t.priority, t.status, 
        t.due_date, t.created_at, t.assigned_to,
        u.email as user_email,
        u.first_name, u.last_name
       FROM detected_tasks t
       JOIN users u ON t.user_id = u.id
       WHERE t.org_id = $1
       ORDER BY 
         CASE t.priority
           WHEN 'urgent' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
         END,
         t.created_at DESC
       LIMIT 100`,
            [user.org_id]
        );

        return NextResponse.json({ tasks: result.rows });
    } catch (error) {
        console.error('Get org tasks error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch organization tasks' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const admin = await requireAdmin(request);
        await ensureDetectedTasksAssignedColumn();
        const { title, description, priority, dueDate, assignedTo } = await request.json();

        if (!title) {
            return NextResponse.json(
                { error: 'Task title is required' },
                { status: 400 }
            );
        }

        // Verify assigned user belongs to the organization
        if (assignedTo) {
            const userCheck = await query(
                `SELECT id FROM org_members WHERE org_id = $1 AND user_id = $2 AND is_active = true`,
                [admin.org_id, assignedTo]
            );

            if (userCheck.rows.length === 0) {
                return NextResponse.json(
                    { error: 'Assigned user not found in your organization' },
                    { status: 400 }
                );
            }
        }

        // Create task
        const result = await query(
            `INSERT INTO detected_tasks (
                org_id, user_id, title, description, priority, due_date, assigned_to, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
            RETURNING id, title, description, priority, due_date, assigned_to, status, created_at`,
            [
                admin.org_id,
                assignedTo || admin.id,
                title,
                description || null,
                priority || 'medium',
                dueDate || null,
                assignedTo || null
            ]
        );

        // Log activity
        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
             VALUES ($1, $2, 'task_created', $3)`,
            [admin.org_id, admin.id, `Admin created task: ${title}`]
        );

        return NextResponse.json({
            success: true,
            task: result.rows[0]
        });
    } catch (error) {
        if (error.message === 'Admin access required') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }
        console.error('Create task error:', error);
        return NextResponse.json(
            { error: 'Failed to create task' },
            { status: 500 }
        );
    }
}
