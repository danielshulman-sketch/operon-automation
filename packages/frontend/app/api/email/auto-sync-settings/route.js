import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { ensureEmailSyncSettingsTable } from '@/utils/ensure-email-sync-settings';

const clampInterval = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 15;
    return Math.min(Math.max(Math.round(parsed), 5), 1440);
};

export async function GET(request) {
    try {
        const user = await requireAuth(request);
        await ensureEmailSyncSettingsTable();

        const result = await query(
            `SELECT enabled, interval_minutes
             FROM user_email_sync_settings
             WHERE user_id = $1 AND org_id = $2
             LIMIT 1`,
            [user.id, user.org_id]
        );

        if (result.rows.length === 0) {
            const insertResult = await query(
                `INSERT INTO user_email_sync_settings (org_id, user_id, enabled, interval_minutes)
                 VALUES ($1, $2, false, 15)
                 RETURNING enabled, interval_minutes`,
                [user.org_id, user.id]
            );

            return NextResponse.json({
                settings: {
                    enabled: insertResult.rows[0].enabled,
                    interval_minutes: insertResult.rows[0].interval_minutes,
                },
            });
        }

        return NextResponse.json({
            settings: {
                enabled: result.rows[0].enabled,
                interval_minutes: result.rows[0].interval_minutes,
            },
        });
    } catch (error) {
        console.error('Get auto sync settings error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch auto sync settings' },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const user = await requireAuth(request);
        await ensureEmailSyncSettingsTable();

        const { enabled, interval_minutes } = await request.json();
        const interval = clampInterval(interval_minutes);

        const result = await query(
            `INSERT INTO user_email_sync_settings (org_id, user_id, enabled, interval_minutes)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id)
             DO UPDATE SET enabled = $3, interval_minutes = $4, updated_at = NOW()
             RETURNING enabled, interval_minutes`,
            [user.org_id, user.id, Boolean(enabled), interval]
        );

        return NextResponse.json({
            settings: {
                enabled: result.rows[0].enabled,
                interval_minutes: result.rows[0].interval_minutes,
            },
        });
    } catch (error) {
        console.error('Update auto sync settings error:', error);
        return NextResponse.json(
            { error: 'Failed to update auto sync settings' },
            { status: 500 }
        );
    }
}
