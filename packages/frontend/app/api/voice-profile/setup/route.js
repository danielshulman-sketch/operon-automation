import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { analyzeVoiceProfile } from '@/utils/openai';

export async function GET(request) {
    try {
        const user = await requireAuth(request);

        const result = await query(
            `SELECT * FROM voice_profiles WHERE user_id = $1 LIMIT 1`,
            [user.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ profile: null });
        }

        return NextResponse.json({ profile: result.rows[0] });
    } catch (error) {
        console.error('Get voice profile error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch voice profile' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const user = await requireAuth(request);
        const { samples, responses } = await request.json();

        if (!samples || !Array.isArray(samples) || samples.length < 3) {
            return NextResponse.json(
                { error: 'At least 3 sample emails are required' },
                { status: 400 }
            );
        }

        if (!responses || typeof responses !== 'object') {
            return NextResponse.json(
                { error: 'Questionnaire responses are required' },
                { status: 400 }
            );
        }

        // Analyze with OpenAI
        const analysis = await analyzeVoiceProfile(samples, responses, { orgId: user.org_id });

        // Save or update voice profile
        const result = await query(
            `INSERT INTO voice_profiles (user_id, sample_emails, questionnaire_responses, tone, formality_level, writing_style, quality_score, is_trained)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       ON CONFLICT (user_id)
       DO UPDATE SET 
         sample_emails = $2,
         questionnaire_responses = $3,
         tone = $4,
         formality_level = $5,
         writing_style = $6,
         quality_score = $7,
         is_trained = true,
         updated_at = NOW()
       RETURNING *`,
            [
                user.id,
                samples,
                JSON.stringify(responses),
                analysis.tone,
                analysis.formality_level,
                JSON.stringify(analysis.writing_style),
                analysis.quality_score,
            ]
        );

        // Log activity
        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
       VALUES ($1, $2, 'voice_profile_trained', 'Completed voice profile training')`,
            [user.org_id, user.id]
        );

        return NextResponse.json({
            success: true,
            profile: result.rows[0],
        });
    } catch (error) {
        console.error('Voice profile setup error:', error);
        if (error?.status === 401 || error?.code === 'invalid_api_key' || error?.message?.includes('AI API key')) {
            return NextResponse.json(
                { error: 'AI API key is invalid or missing. Please update your API key in settings.' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to create voice profile' },
            { status: 500 }
        );
    }
}
