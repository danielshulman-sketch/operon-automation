import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { classifyEmail, generateDraft } from '@/utils/openai';
import { ensureAutoDraftSettingsTable } from '@/utils/ensure-auto-draft-settings';

const parseCategories = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
        return JSON.parse(value);
    } catch (error) {
        return [];
    }
};

const getAutoDraftSettings = async (user) => {
    await ensureAutoDraftSettingsTable();
    const result = await query(
        `SELECT enabled, categories
         FROM user_auto_draft_settings
         WHERE user_id = $1 AND org_id = $2
         LIMIT 1`,
        [user.id, user.org_id]
    );

    if (result.rows.length === 0) {
        return { enabled: false, categories: [] };
    }

    return {
        enabled: Boolean(result.rows[0].enabled),
        categories: parseCategories(result.rows[0].categories),
    };
};

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
        const classification = await classifyEmail(emailContent, { orgId: user.org_id });

        // Update email classification
        await query(
            `UPDATE email_messages SET classification = $1 WHERE id = $2`,
            [classification.classification, email_id]
        );

        let draft = null;
        try {
            const settings = await getAutoDraftSettings(user);
            const categories = settings.categories || [];
            const shouldAutoDraft =
                settings.enabled &&
                categories.includes(classification.classification);

            if (shouldAutoDraft) {
                const existingDraft = await query(
                    `SELECT id FROM email_drafts WHERE reply_to_message_id = $1 AND user_id = $2 LIMIT 1`,
                    [email_id, user.id]
                );

                if (existingDraft.rows.length === 0) {
                    const voiceProfileResult = await query(
                        `SELECT * FROM voice_profiles WHERE user_id = $1 AND is_trained = true LIMIT 1`,
                        [user.id]
                    );

                    const voiceProfile = voiceProfileResult.rows[0] || null;

                    if (voiceProfile) {
                        const emailContent = `From: ${email.from_address}\nSubject: ${email.subject}\n\n${email.body_text}`;
                        const generatedDraft = await generateDraft(emailContent, voiceProfile, { orgId: user.org_id });

                        const draftResult = await query(
                            `INSERT INTO email_drafts (org_id, user_id, reply_to_message_id, subject, body)
                             VALUES ($1, $2, $3, $4, $5)
                             RETURNING id, subject, body, created_at`,
                            [user.org_id, user.id, email_id, generatedDraft.subject, generatedDraft.body]
                        );

                        draft = draftResult.rows[0];
                    }
                }
            }
        } catch (draftError) {
            console.error('Auto draft generation failed:', draftError);
        }

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
            draft,
        });
    } catch (error) {
        console.error('Email classification error:', error);
        return NextResponse.json(
            { error: 'Failed to classify email' },
            { status: 500 }
        );
    }
}
