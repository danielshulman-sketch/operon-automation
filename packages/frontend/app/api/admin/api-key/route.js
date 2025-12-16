import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAdmin } from '@/utils/auth';

// Get organization's API key status (not the actual key)
export async function GET(request) {
    try {
        const admin = await requireAdmin(request);

        const result = await query(
            `SELECT id, created_at, updated_at FROM org_api_keys WHERE org_id = $1`,
            [admin.org_id]
        );

        return NextResponse.json({
            hasKey: result.rows.length > 0,
            keyInfo: result.rows[0] || null
        });
    } catch (error) {
        console.error('Get API key error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check API key' },
            { status: error.message === 'Admin access required' ? 403 : 500 }
        );
    }
}

// Set or update organization's API key
export async function POST(request) {
    try {
        const admin = await requireAdmin(request);
        const { apiKey } = await request.json();

        if (!apiKey || !apiKey.startsWith('sk-')) {
            return NextResponse.json(
                { error: 'Invalid API key format. OpenAI keys start with "sk-"' },
                { status: 400 }
            );
        }

        // Check if key already exists
        const existing = await query(
            `SELECT id FROM org_api_keys WHERE org_id = $1`,
            [admin.org_id]
        );

        if (existing.rows.length > 0) {
            // Update existing key
            await query(
                `UPDATE org_api_keys 
                 SET openai_api_key = $1, updated_at = NOW()
                 WHERE org_id = $2`,
                [apiKey, admin.org_id]
            );
        } else {
            // Insert new key
            await query(
                `INSERT INTO org_api_keys (org_id, openai_api_key, created_by)
                 VALUES ($1, $2, $3)`,
                [admin.org_id, apiKey, admin.id]
            );
        }

        // Log activity
        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
             VALUES ($1, $2, 'api_key_updated', 'Admin updated OpenAI API key')`,
            [admin.org_id, admin.id]
        );

        return NextResponse.json({
            success: true,
            message: 'API key saved successfully'
        });
    } catch (error) {
        console.error('Save API key error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save API key' },
            { status: error.message === 'Admin access required' ? 403 : 500 }
        );
    }
}

// Delete organization's API key
export async function DELETE(request) {
    try {
        const admin = await requireAdmin(request);

        await query(
            `DELETE FROM org_api_keys WHERE org_id = $1`,
            [admin.org_id]
        );

        return NextResponse.json({
            success: true,
            message: 'API key deleted successfully'
        });
    } catch (error) {
        console.error('Delete API key error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete API key' },
            { status: error.message === 'Admin access required' ? 403 : 500 }
        );
    }
}
