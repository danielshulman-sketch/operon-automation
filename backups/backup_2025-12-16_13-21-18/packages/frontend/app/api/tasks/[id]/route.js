import { NextResponse } from 'next/server';
import { query } from '../../../../utils/db';
import { requireAuth } from '../../../../utils/auth';

export async function PUT(request, { params }) {
    try {
        const user = await requireAuth(request);
        const { id } = params;
        const { status, title, description, priority, dueDate } = await request.json();

        const result = await query(
            `UPDATE detected_tasks
       SET status = COALESCE($1, status),
           title = COALESCE($2, title),
           description = COALESCE($3, description),
           priority = COALESCE($4, priority),
           due_date = COALESCE($5, due_date),
           updated_at = NOW()
       WHERE id = $6 AND org_id = $7
       RETURNING *`,
            [status, title, description, priority, dueDate ? new Date(dueDate) : null, id, user.org_id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Task not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ task: result.rows[0] });
    } catch (error) {
        console.error('Update task error:', error);
        return NextResponse.json(
            { error: 'Failed to update task' },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = await requireAuth(request);
        const { id } = params;

        await query(
            `DELETE FROM detected_tasks WHERE id = $1 AND org_id = $2`,
            [id, user.org_id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete task error:', error);
        return NextResponse.json(
            { error: 'Failed to delete task' },
            { status: 500 }
        );
    }
}
