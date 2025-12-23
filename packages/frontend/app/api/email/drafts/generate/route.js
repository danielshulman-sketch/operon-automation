import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { generateDraft } from '@/utils/openai';

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

        // Get user's voice profile
        const voiceProfileResult = await query(
            `SELECT * FROM voice_profiles WHERE user_id = $1 AND is_trained = true LIMIT 1`,
            [user.id]
        );

        const voiceProfile = voiceProfileResult.rows[0] || null;

        // Generate draft
        const emailContent = `From: ${email.from_address}\nSubject: ${email.subject}\n\n${email.body_text}`;
        const draft = await generateDraft(emailContent, voiceProfile, { orgId: user.org_id });

        // Save draft
        const draftResult = await query(
            `INSERT INTO email_drafts (org_id, user_id, reply_to_message_id, subject, body)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, subject, body, created_at`,
            [user.org_id, user.id, email_id, draft.subject, draft.body]
        );

        // Log activity
        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
       VALUES ($1, $2, 'draft_generated', $3)`,
            [user.org_id, user.id, `Generated draft for: ${email.subject}`]
        );

        return NextResponse.json({
            success: true,
            draft: draftResult.rows[0],
        });
    } catch (error) {
        console.error('Draft generation error:', error);
        if (error?.status === 401 || error?.code === 'invalid_api_key' || error?.message?.includes('AI API key')) {
            return NextResponse.json(
                { error: 'AI API key is invalid or missing. Please update your API key in settings.' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to generate draft' },
            { status: 500 }
        );
    }
}
