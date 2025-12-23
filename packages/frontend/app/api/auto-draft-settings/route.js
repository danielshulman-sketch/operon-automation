import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { ensureAutoDraftSettingsTable } from '@/utils/ensure-auto-draft-settings';

const ALLOWED_CATEGORIES = ['task', 'fyi', 'question', 'approval', 'meeting'];

const parseCategories = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
        return JSON.parse(value);
    } catch (error) {
        return [];
    }
};

const normalizeCategories = (categories) =>
    categories
        .map((category) => String(category).trim())
        .filter((category) => ALLOWED_CATEGORIES.includes(category));

export async function GET(request) {
    try {
        const user = await requireAuth(request);
        await ensureAutoDraftSettingsTable();

        const result = await query(
            `SELECT enabled, categories
             FROM user_auto_draft_settings
             WHERE user_id = $1 AND org_id = $2
             LIMIT 1`,
            [user.id, user.org_id]
        );

        if (result.rows.length === 0) {
            const insertResult = await query(
                `INSERT INTO user_auto_draft_settings (org_id, user_id, enabled, categories)
                 VALUES ($1, $2, false, $3)
                 RETURNING enabled, categories`,
                [user.org_id, user.id, JSON.stringify([])]
            );

            const row = insertResult.rows[0];
            return NextResponse.json({
                settings: {
                    enabled: row.enabled,
                    categories: parseCategories(row.categories),
                },
            });
        }

        const row = result.rows[0];
        return NextResponse.json({
            settings: {
                enabled: row.enabled,
                categories: parseCategories(row.categories),
            },
        });
    } catch (error) {
        console.error('Get auto draft settings error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch auto draft settings' },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const user = await requireAuth(request);
        await ensureAutoDraftSettingsTable();

        const { enabled, categories } = await request.json();
        const normalizedCategories = normalizeCategories(Array.isArray(categories) ? categories : []);

        const result = await query(
            `INSERT INTO user_auto_draft_settings (org_id, user_id, enabled, categories)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id)
             DO UPDATE SET enabled = $3, categories = $4, updated_at = NOW()
             RETURNING enabled, categories`,
            [user.org_id, user.id, Boolean(enabled), JSON.stringify(normalizedCategories)]
        );

        const row = result.rows[0];
        return NextResponse.json({
            settings: {
                enabled: row.enabled,
                categories: parseCategories(row.categories),
            },
        });
    } catch (error) {
        console.error('Update auto draft settings error:', error);
        return NextResponse.json(
            { error: 'Failed to update auto draft settings' },
            { status: 500 }
        );
    }
}
