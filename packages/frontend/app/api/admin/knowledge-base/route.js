import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAdmin } from '@/utils/auth';

// Get all knowledge base documents for the organization
export async function GET(request) {
    try {
        const admin = await requireAdmin(request);

        const result = await query(
            `SELECT 
                kb.id, kb.title, kb.content, kb.category, kb.tags,
                kb.created_at, kb.updated_at, kb.is_active,
                u.email as created_by_email,
                u.first_name, u.last_name
             FROM knowledge_base kb
             LEFT JOIN users u ON kb.created_by = u.id
             WHERE kb.org_id = $1
             ORDER BY kb.updated_at DESC`,
            [admin.org_id]
        );

        return NextResponse.json({ documents: result.rows });
    } catch (error) {
        console.error('Get knowledge base error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch knowledge base' },
            { status: error.message === 'Admin access required' ? 403 : 500 }
        );
    }
}

// Create new knowledge base document
export async function POST(request) {
    try {
        const admin = await requireAdmin(request);
        const { title, content, category, tags } = await request.json();

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        const result = await query(
            `INSERT INTO knowledge_base (org_id, title, content, category, tags, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, title, content, category, tags, created_at, updated_at, is_active`,
            [admin.org_id, title, content, category || null, JSON.stringify(tags || []), admin.id]
        );

        // Log activity
        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
             VALUES ($1, $2, 'knowledge_base_created', $3)`,
            [admin.org_id, admin.id, `Created knowledge base document: ${title}`]
        );

        return NextResponse.json({
            success: true,
            document: result.rows[0]
        });
    } catch (error) {
        console.error('Create knowledge base error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create document' },
            { status: error.message === 'Admin access required' ? 403 : 500 }
        );
    }
}

// Update knowledge base document
export async function PUT(request) {
    try {
        const admin = await requireAdmin(request);
        const { id, title, content, category, tags, isActive } = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: 'Document ID is required' },
                { status: 400 }
            );
        }

        const result = await query(
            `UPDATE knowledge_base
             SET title = COALESCE($1, title),
                 content = COALESCE($2, content),
                 category = COALESCE($3, category),
                 tags = COALESCE($4, tags),
                 is_active = COALESCE($5, is_active),
                 updated_at = NOW()
             WHERE id = $6 AND org_id = $7
             RETURNING id, title, content, category, tags, created_at, updated_at, is_active`,
            [title, content, category, tags, isActive, id, admin.org_id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            document: result.rows[0]
        });
    } catch (error) {
        console.error('Update knowledge base error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update document' },
            { status: error.message === 'Admin access required' ? 403 : 500 }
        );
    }
}

// Delete knowledge base document
export async function DELETE(request) {
    try {
        const admin = await requireAdmin(request);
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Document ID is required' },
                { status: 400 }
            );
        }

        await query(
            `DELETE FROM knowledge_base WHERE id = $1 AND org_id = $2`,
            [id, admin.org_id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete knowledge base error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete document' },
            { status: error.message === 'Admin access required' ? 403 : 500 }
        );
    }
}
