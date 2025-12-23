import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { classifyEmail } from '@/utils/openai';

export async function GET(request) {
    console.log('=== STARTING BULK CLASSIFICATION ===');
    try {
        const total = await query('SELECT COUNT(*) FROM email_messages');
        const unclassifiedRes = await query(`
            SELECT COUNT(*) FROM email_messages 
            WHERE classification IS NULL OR classification = ''
        `);

        console.log(`Debug: Total ${total.rows[0].count}, Unclassified ${unclassifiedRes.rows[0].count}`);

        // 1. Fetch unclassified emails
        // Using proven query that avoids potential column issues
        const res = await query('SELECT id, org_id, subject, body_text, classification FROM email_messages WHERE classification IS NULL LIMIT 50');
        console.log('Query rowCount:', res.rowCount);

        const emails = res.rows;
        console.log(`Found ${emails.length} unclassified emails`);

        let count = 0;

        for (const email of emails) {
            try {
                // Construct content for classification
                const content = `Subject: ${email.subject}\n\n${email.body_text?.substring(0, 1000) || ''}`;

                // Get User ID for tasks 
                let userId = null;
                try {
                    const userRes = await query('SELECT user_id FROM org_members WHERE org_id = $1 LIMIT 1', [email.org_id]);
                    userId = userRes.rows[0]?.user_id;
                } catch (e) {
                    // Log but continue
                    console.error(`Failed to fetch user_id for org ${email.org_id}: ${e.message}`);
                }

                // Call OpenAI
                const classification = await classifyEmail(content, { orgId: email.org_id });

                // Update DB
                await query('UPDATE email_messages SET classification = $1 WHERE id = $2', [classification.classification, email.id]);

                // Insert tasks if any
                if (classification.tasks?.length > 0 && userId) {
                    for (const task of classification.tasks) {
                        try {
                            await query(
                                `INSERT INTO detected_tasks (org_id, user_id, email_message_id, title, description, priority, due_date, status)
                                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
                                [
                                    email.org_id,
                                    userId,
                                    email.id,
                                    task.title,
                                    task.description || null,
                                    task.priority || 'medium',
                                    task.due_date ? new Date(task.due_date) : null,
                                ]
                            );
                        } catch (e) {
                            console.error(`Failed to insert task: ${e.message}`);
                        }
                    }
                }

                count++;
            } catch (err) {
                console.error(`Failed to classify email ${email.id}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            processed: count,
            remaining: parseInt(unclassifiedRes.rows[0].count) - count
        });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
