import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAdmin } from '@/utils/auth';

export async function POST(request) {
    try {
        const admin = await requireAdmin(request);
        const formData = await request.formData();
        const file = formData.get('file');
        const category = formData.get('category') || '';
        const tags = formData.get('tags') || '';

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Get file extension
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();

        // Supported file types
        const supportedTypes = ['txt', 'md', 'pdf', 'doc', 'docx'];
        if (!supportedTypes.includes(fileExtension)) {
            return NextResponse.json(
                { error: `Unsupported file type. Supported: ${supportedTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Read file content
        const fileBuffer = await file.arrayBuffer();
        const fileContent = Buffer.from(fileBuffer);

        let extractedText = '';

        // Extract text based on file type
        if (fileExtension === 'txt' || fileExtension === 'md') {
            extractedText = fileContent.toString('utf-8');
        } else if (fileExtension === 'pdf') {
            // For PDF, we'll use a simple text extraction
            // Note: For production, use a library like pdf-parse
            extractedText = fileContent.toString('utf-8');
        } else {
            // For DOC/DOCX, basic extraction
            extractedText = fileContent.toString('utf-8');
        }

        // Clean up extracted text
        extractedText = extractedText
            .replace(/\x00/g, '') // Remove null bytes
            .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-printable characters
            .trim();

        if (!extractedText || extractedText.length < 10) {
            return NextResponse.json(
                { error: 'Could not extract text from file. File may be empty or corrupted.' },
                { status: 400 }
            );
        }

        // Create title from filename
        const title = fileName.replace(/\.[^/.]+$/, ''); // Remove extension

        // Parse tags
        const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);

        // Save to knowledge base
        const result = await query(
            `INSERT INTO knowledge_base (org_id, title, content, category, tags, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, title, content, category, tags, created_at, updated_at, is_active`,
            [admin.org_id, title, extractedText, category || null, JSON.stringify(tagArray), admin.id]
        );

        // Log activity
        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
             VALUES ($1, $2, 'knowledge_base_created', $3)`,
            [admin.org_id, admin.id, `Uploaded file: ${fileName}`]
        );

        return NextResponse.json({
            success: true,
            document: result.rows[0],
            message: `File "${fileName}" uploaded successfully`
        });
    } catch (error) {
        console.error('Upload file error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to upload file' },
            { status: error.message === 'Admin access required' ? 403 : 500 }
        );
    }
}
