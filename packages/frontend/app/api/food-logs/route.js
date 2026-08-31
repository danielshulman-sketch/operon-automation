import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { ensureFoodPainTrackerTables } from '@/utils/ensure-food-pain-tracker';
import { analyzeFoodImage } from '@/utils/openai';

const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // ~6MB, base64-encoded

export async function GET(request) {
    try {
        const user = await requireAuth(request);
        await ensureFoodPainTrackerTables();

        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        let queryText = `SELECT * FROM food_logs WHERE org_id = $1 AND user_id = $2`;
        const params = [user.org_id, user.id];

        if (from) {
            params.push(from);
            queryText += ` AND log_date >= $${params.length}`;
        }
        if (to) {
            params.push(to);
            queryText += ` AND log_date <= $${params.length}`;
        }

        queryText += ` ORDER BY created_at DESC LIMIT 200`;

        const result = await query(queryText, params);

        return NextResponse.json({ foodLogs: result.rows });
    } catch (error) {
        console.error('Get food logs error:', error);
        return NextResponse.json({ error: 'Failed to fetch food logs' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await requireAuth(request);
        await ensureFoodPainTrackerTables();

        const { image, description, logDate } = await request.json();

        if (!image && !description) {
            return NextResponse.json(
                { error: 'Provide a photo, a description, or both' },
                { status: 400 }
            );
        }

        if (image && (typeof image !== 'string' || !image.startsWith('data:image/'))) {
            return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
        }

        if (image && image.length > MAX_IMAGE_BYTES) {
            return NextResponse.json({ error: 'Image is too large (max ~4MB)' }, { status: 400 });
        }

        const resolvedDate = logDate || new Date().toISOString().slice(0, 10);

        let aiAnalysis = null;
        try {
            aiAnalysis = await analyzeFoodImage({
                orgId: user.org_id,
                imageDataUrl: image || null,
                description: description || null,
            });
        } catch (error) {
            console.error('Food image analysis failed, continuing without it:', error.message);
        }

        const result = await query(
            `INSERT INTO food_logs (org_id, user_id, image_data, description, log_date, ai_analysis)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                user.org_id,
                user.id,
                image || null,
                description || null,
                resolvedDate,
                aiAnalysis ? JSON.stringify(aiAnalysis) : null,
            ]
        );

        return NextResponse.json({ foodLog: result.rows[0] });
    } catch (error) {
        console.error('Create food log error:', error);
        return NextResponse.json({ error: 'Failed to save food log' }, { status: 500 });
    }
}
