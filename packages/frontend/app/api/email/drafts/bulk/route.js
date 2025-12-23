import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { generateDraft } from '@/utils/openai';

export async function POST(request) {
    try {
        const user = await requireAuth(request);
        const { email_ids, category_filter } = await request.json();

        if (!email_ids || !Array.isArray(email_ids) || email_ids.length === 0) {
            return NextResponse.json(
                { error: 'Email IDs array is required' },
                { status: 400 }
            );
        }

        if (email_ids.length > 50) {
            return NextResponse.json(
                { error: 'Maximum 50 emails per batch' },
                { status: 400 }
            );
        }

        // Get user's voice profile
        const voiceProfileResult = await query(
            `SELECT * FROM voice_profiles WHERE user_id = $1 AND is_trained = true LIMIT 1`,
            [user.id]
        );

        const voiceProfile = voiceProfileResult.rows[0] || null;

        // Create bulk draft job
        const jobResult = await query(
            `INSERT INTO bulk_draft_jobs (org_id, user_id, status, total_emails)
       VALUES ($1, $2, 'processing', $3)
       RETURNING id`,
            [user.org_id, user.id, email_ids.length]
        );

        const jobId = jobResult.rows[0].id;

        const results = [];
        let successCount = 0;
        let failedCount = 0;

        // Process each email
        for (const emailId of email_ids) {
            try {
                // Get email
                const emailResult = await query(
                    `SELECT * FROM email_messages WHERE id = $1 AND org_id = $2`,
                    [emailId, user.org_id]
                );

                if (emailResult.rows.length === 0) {
                    failedCount++;
                    results.push({ email_id: emailId, success: false, error: 'Email not found' });
                    continue;
                }

                const email = emailResult.rows[0];
                const emailContent = `From: ${email.from_address}\nSubject: ${email.subject}\n\n${email.body_text}`;

                // Generate draft with OpenAI
                const draft = await generateDraft(emailContent, voiceProfile, { orgId: user.org_id });

                // Save draft
                await query(
                    `INSERT INTO email_drafts (org_id, user_id, reply_to_message_id, subject, body)
           VALUES ($1, $2, $3, $4, $5)`,
                    [user.org_id, user.id, emailId, draft.subject, draft.body]
                );

                successCount++;
                results.push({ email_id: emailId, success: true, draft });
            } catch (error) {
                console.error(`Failed to generate draft for email ${emailId}:`, error);
                failedCount++;
                results.push({ email_id: emailId, success: false, error: error.message });
            }

            // Update job progress
            await query(
                `UPDATE bulk_draft_jobs 
         SET processed_count = $1, success_count = $2, failed_count = $3
         WHERE id = $4`,
                [successCount + failedCount, successCount, failedCount, jobId]
            );
        }

        // Mark job as completed
        await query(
            `UPDATE bulk_draft_jobs 
       SET status = 'completed', completed_at = NOW(), results = $1
       WHERE id = $2`,
            [JSON.stringify(results), jobId]
        );

        // Log activity
        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
       VALUES ($1, $2, 'bulk_drafts_generated', $3)`,
            [user.org_id, user.id, `Generated ${successCount} drafts from ${email_ids.length} emails`]
        );

        return NextResponse.json({
            success: true,
            job_id: jobId,
            total: email_ids.length,
            success_count: successCount,
            failed_count: failedCount,
            results,
        });
    } catch (error) {
        console.error('Bulk draft generation error:', error);
        if (error?.status === 401 || error?.code === 'invalid_api_key' || error?.message?.includes('AI API key')) {
            return NextResponse.json(
                { error: 'AI API key is invalid or missing. Please update your API key in settings.' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to generate drafts' },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        const user = await requireAuth(request);
        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('job_id');

        if (jobId) {
            const result = await query(
                `SELECT * FROM bulk_draft_jobs WHERE id = $1 AND org_id = $2`,
                [jobId, user.org_id]
            );

            if (result.rows.length === 0) {
                return NextResponse.json(
                    { error: 'Job not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ job: result.rows[0] });
        }

        // List all jobs
        const result = await query(
            `SELECT * FROM bulk_draft_jobs 
       WHERE org_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
            [user.org_id]
        );

        return NextResponse.json({ jobs: result.rows });
    } catch (error) {
        console.error('Get bulk draft jobs error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch jobs' },
            { status: 500 }
        );
    }
}
