import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';

export async function POST(request) {
    try {
        const user = await requireAuth(request);
        const { provider, email, password, imapHost, imapPort, smtpHost, smtpPort } = await request.json();

        if (!email || !password || !imapHost || !smtpHost) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Encrypt password (in production, use proper encryption)
        // For now, we'll store it as-is (NOT RECOMMENDED for production)
        const encryptedPassword = Buffer.from(password).toString('base64');

        // Check if mailbox already exists for this email
        const existing = await query(
            'SELECT id FROM mailboxes WHERE email_address = $1 AND org_id = $2',
            [email, user.org_id]
        );

        let mailboxId;

        if (existing.rows.length > 0) {
            // Update existing mailbox
            await query(
                `UPDATE mailboxes 
         SET provider = $1, imap_host = $2, imap_port = $3, 
             smtp_host = $4, smtp_port = $5, password_encrypted = $6,
             is_active = true, last_sync_at = NOW()
         WHERE id = $7`,
                [provider, imapHost, parseInt(imapPort), smtpHost, parseInt(smtpPort), encryptedPassword, existing.rows[0].id]
            );
            mailboxId = existing.rows[0].id;
        } else {
            // Create new mailbox
            const result = await query(
                `INSERT INTO mailboxes (org_id, user_id, email_address, provider, imap_host, imap_port, smtp_host, smtp_port, password_encrypted, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
         RETURNING id`,
                [user.org_id, user.id, email, provider, imapHost, parseInt(imapPort), smtpHost, parseInt(smtpPort), encryptedPassword]
            );
            mailboxId = result.rows[0].id;
        }

        // Log activity
        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
       VALUES ($1, $2, 'email_connected', $3)`,
            [user.org_id, user.id, `Connected email account: ${email}`]
        );

        return NextResponse.json({
            success: true,
            mailboxId,
            message: 'Email account connected successfully',
        });
    } catch (error) {
        console.error('Email connection error:', error);
        return NextResponse.json(
            { error: 'Failed to connect email account' },
            { status: 500 }
        );
    }
}

// Get connected email accounts
export async function GET(request) {
    try {
        const user = await requireAuth(request);

        const result = await query(
            `SELECT id, email_address, provider, imap_host, smtp_host, is_active, last_sync_at, created_at
       FROM mailboxes
       WHERE org_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
            [user.org_id, user.id]
        );

        return NextResponse.json({ mailboxes: result.rows });
    } catch (error) {
        console.error('Get mailboxes error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch mailboxes' },
            { status: 500 }
        );
    }
}
