import { NextResponse } from 'next/server';
import { query } from '../../../../utils/db';
import { requireAuth } from '../../../../utils/auth';
import { classifyEmail } from '../../../../utils/openai';

export async function POST(request) {
    try {
        const user = await requireAuth(request);
        const { email_id } = await request.json();

        if (!email_id) {
            return NextResponse.json(
                { error: 'Email ID is required' },
                { status: 400 }
            );
        }

        // Get email
        const emailResult = await query(
            `SELECT * FROM email_messages WHERE id = $1 AND org_id = $2`,
            [email_id, user.org_id]
        );

        if (emailResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Email not found' },
                { status: 404 }
            );
        }

        const email = emailResult.rows[0];

        // Classify with OpenAI
        const emailContent = `From: ${email.from_address}\nSubject: ${email.subject}\n\n${email.body_text}`;
        const classification = await classifyEmail(emailContent);

        // Update email classification
        await query(
            `UPDATE email_messages SET classification = $1 WHERE id = $2`,
            [classification.classification, email_id]
        );

        // Extract and create tasks
        if (classification.tasks && classification.tasks.length > 0) {
            for (const task of classification.tasks) {
                await query(
                    `INSERT INTO detected_tasks (org_id, user_id, email_message_id, title, description, priority, due_date, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
                    [
                        user.org_id,
                        user.id,
                        email_id,
                        task.title,
                        task.description || null,
                        task.priority || 'medium',
                        task.due_date ? new Date(task.due_date) : null,
                    ]
                );
            }
        }

        // Log activity
        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
       VALUES ($1, $2, 'email_classified', $3)`,
            [user.org_id, user.id, `Classified email: ${email.subject}`]
        );

        return NextResponse.json({
            success: true,
            classification: classification.classification,
            tasks: classification.tasks,
        });
    } catch (error) {
        console.error('Email classification error:', error);
        return NextResponse.json(
            { error: 'Failed to classify email' },
            { status: 500 }
        );
    }
}
