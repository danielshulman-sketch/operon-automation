import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { ensureDetectedTasksAssignedColumn } from '@/utils/ensure-detected-tasks-columns';

export async function GET(request) {
    try {
        const user = await requireAuth(request);
        await ensureDetectedTasksAssignedColumn();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let queryText = `
      SELECT * FROM detected_tasks
      WHERE org_id = $1 AND (user_id = $2 OR assigned_to = $2)
    `;
        const params = [user.org_id, user.id];

        if (status && status !== 'all') {
            queryText += ` AND status = $3`;
            params.push(status);
        }

        queryText += ` ORDER BY created_at DESC LIMIT 100`;

        const result = await query(queryText, params);

        return NextResponse.json({ tasks: result.rows });
    } catch (error) {
        console.error('Get tasks error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tasks' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const user = await requireAuth(request);
        await ensureDetectedTasksAssignedColumn();
        const { title, description, priority, dueDate, emailMessageId } = await request.json();

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        const result = await query(
            `INSERT INTO detected_tasks (org_id, user_id, email_message_id, title, description, priority, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
            [
                user.org_id,
                user.id,
                emailMessageId || null,
                title,
                description || null,
                priority || 'medium',
                dueDate ? new Date(dueDate) : null,
            ]
        );

        return NextResponse.json({ task: result.rows[0] });
    } catch (error) {
        console.error('Create task error:', error);
        return NextResponse.json(
            { error: 'Failed to create task' },
            { status: 500 }
        );
    }
}
