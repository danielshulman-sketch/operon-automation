import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { ensureFoodPainTrackerTables } from '@/utils/ensure-food-pain-tracker';

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
