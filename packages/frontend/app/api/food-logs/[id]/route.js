import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { ensureFoodPainTrackerTables } from '@/utils/ensure-food-pain-tracker';
import { analyzeFoodImage } from '@/utils/openai';

export async function PATCH(request, { params }) {
    try {
        const user = await requireAuth(request);
        await ensureFoodPainTrackerTables();
        const { id } = params;

        const { description } = await request.json();
        const trimmedDescription = (description || '').trim();

        if (!trimmedDescription) {
            return NextResponse.json({ error: 'Description is required' }, { status: 400 });
        }

        const existing = await query(
            `SELECT * FROM food_logs WHERE id = $1 AND org_id = $2 AND user_id = $3`,
            [id, user.org_id, user.id]
        );

        if (existing.rows.length === 0) {
            return NextResponse.json({ error: 'Food log not found' }, { status: 404 });
        }

        const foodLog = existing.rows[0];
        const wasUnrecognized = !foodLog.ai_analysis || (foodLog.ai_analysis.items || []).length === 0;

        let aiAnalysis = foodLog.ai_analysis;
        if (wasUnrecognized) {
            try {
                const reanalyzed = await analyzeFoodImage({
                    orgId: user.org_id,
                    imageDataUrl: foodLog.image_data || null,
                    description: trimmedDescription,
                });
                if (reanalyzed) {
                    aiAnalysis = reanalyzed;
                }
            } catch (error) {
                console.error('Re-analysis after manual description failed, keeping existing analysis:', error.message);
            }
        }

        const result = await query(
            `UPDATE food_logs SET description = $1, ai_analysis = $2
             WHERE id = $3 AND org_id = $4 AND user_id = $5
             RETURNING *`,
            [trimmedDescription, aiAnalysis ? JSON.stringify(aiAnalysis) : null, id, user.org_id, user.id]
        );

        return NextResponse.json({ foodLog: result.rows[0] });
    } catch (error) {
        console.error('Update food log error:', error);
        return NextResponse.json({ error: 'Failed to update food log' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = await requireAuth(request);
        await ensureFoodPainTrackerTables();
        const { id } = params;

        const result = await query(
            `DELETE FROM food_logs WHERE id = $1 AND org_id = $2 AND user_id = $3 RETURNING id`,
            [id, user.org_id, user.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Food log not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete food log error:', error);
        return NextResponse.json({ error: 'Failed to delete food log' }, { status: 500 });
    }
}
