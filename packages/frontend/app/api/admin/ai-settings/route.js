import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAdmin } from '@/utils/auth';
import { ensureAiSettingsTable } from '@/utils/ensure-ai-settings';

const ALLOWED_PROVIDERS = ['openai', 'anthropic', 'google'];

const normalizeProvider = (provider) =>
    ALLOWED_PROVIDERS.includes(provider) ? provider : 'openai';

export async function GET(request) {
    try {
        const admin = await requireAdmin(request);
        await ensureAiSettingsTable();

        const result = await query(
            `SELECT provider, model, openai_api_key, anthropic_api_key, google_api_key
             FROM org_ai_settings
             WHERE org_id = $1
             LIMIT 1`,
            [admin.org_id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({
                settings: {
                    provider: 'openai',
                    model: '',
                    hasOpenAIKey: false,
                    hasAnthropicKey: false,
                    hasGoogleKey: false,
                },
            });
        }

        const row = result.rows[0];
        return NextResponse.json({
            settings: {
                provider: row.provider || 'openai',
                model: row.model || '',
                hasOpenAIKey: Boolean(row.openai_api_key),
                hasAnthropicKey: Boolean(row.anthropic_api_key),
                hasGoogleKey: Boolean(row.google_api_key),
            },
        });
    } catch (error) {
        console.error('Get AI settings error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch AI settings' },
            { status: error.message === 'Admin access required' ? 403 : 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const admin = await requireAdmin(request);
        await ensureAiSettingsTable();
        const { provider, model, openaiApiKey, anthropicApiKey, googleApiKey } = await request.json();

        const normalizedProvider = normalizeProvider(provider);
        const normalizedModel = typeof model === 'string' ? model.trim() : '';

        const existing = await query(
            `SELECT id FROM org_ai_settings WHERE org_id = $1`,
            [admin.org_id]
        );

        if (existing.rows.length > 0) {
            await query(
                `UPDATE org_ai_settings
                 SET provider = $1,
                     model = $2,
                     openai_api_key = COALESCE(NULLIF($3, ''), openai_api_key),
                     anthropic_api_key = COALESCE(NULLIF($4, ''), anthropic_api_key),
                     google_api_key = COALESCE(NULLIF($5, ''), google_api_key),
                     updated_at = NOW()
                 WHERE org_id = $6`,
                [
                    normalizedProvider,
                    normalizedModel,
                    openaiApiKey || '',
                    anthropicApiKey || '',
                    googleApiKey || '',
                    admin.org_id,
                ]
            );
        } else {
            await query(
                `INSERT INTO org_ai_settings (
                    org_id,
                    provider,
                    model,
                    openai_api_key,
                    anthropic_api_key,
                    google_api_key
                 )
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    admin.org_id,
                    normalizedProvider,
                    normalizedModel,
                    openaiApiKey || null,
                    anthropicApiKey || null,
                    googleApiKey || null,
                ]
            );
        }

        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
             VALUES ($1, $2, 'ai_settings_updated', 'Admin updated AI provider settings')`,
            [admin.org_id, admin.id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update AI settings error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update AI settings' },
            { status: error.message === 'Admin access required' ? 403 : 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const admin = await requireAdmin(request);
        await ensureAiSettingsTable();

        await query(`DELETE FROM org_ai_settings WHERE org_id = $1`, [admin.org_id]);
        await query(`DELETE FROM org_api_keys WHERE org_id = $1`, [admin.org_id]);

        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
             VALUES ($1, $2, 'ai_settings_cleared', 'Admin cleared AI provider keys')`,
            [admin.org_id, admin.id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete AI settings error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete AI settings' },
            { status: error.message === 'Admin access required' ? 403 : 500 }
        );
    }
}
