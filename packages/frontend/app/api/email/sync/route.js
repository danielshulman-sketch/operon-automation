import { NextResponse } from 'next/server';
import { query } from '../../../../utils/db';
import { requireAuth } from '../../../../utils/auth';
import { google } from 'googleapis';

export async function POST(request) {
    try {
        const user = await requireAuth(request);
        const { mailboxId } = await request.json();

        // Get mailbox and OAuth connection
        const mailboxResult = await query(
            `SELECT m.*, o.access_token, o.refresh_token
       FROM mailboxes m
       LEFT JOIN oauth_connections o ON m.user_id = o.user_id AND o.provider = 'gmail'
       WHERE m.id = $1 AND m.org_id = $2`,
            [mailboxId || null, user.org_id]
        );

        if (mailboxResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Mailbox not found' },
                { status: 404 }
            );
        }

        const mailbox = mailboxResult.rows[0];

        if (mailbox.connection_type === 'gmail') {
            // Sync Gmail
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET
            );

            oauth2Client.setCredentials({
                access_token: mailbox.access_token,
                refresh_token: mailbox.refresh_token,
            });

            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

            // Get messages (last 50)
            const response = await gmail.users.messages.list({
                userId: 'me',
                maxResults: 50,
                q: mailbox.sync_cursor ? `after:${mailbox.sync_cursor}` : undefined,
            });

            const messages = response.data.messages || [];
            let synced = 0;

            for (const msg of messages) {
                try {
                    const fullMessage = await gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id,
                        format: 'full',
                    });

                    const headers = fullMessage.data.payload.headers;
                    const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
                    const from = headers.find(h => h.name === 'From')?.value || '';
                    const to = headers.find(h => h.name === 'To')?.value || '';
                    const date = headers.find(h => h.name === 'Date')?.value || '';

                    // Extract body
                    let bodyText = '';
                    if (fullMessage.data.payload.body.data) {
                        bodyText = Buffer.from(fullMessage.data.payload.body.data, 'base64').toString('utf-8');
                    } else if (fullMessage.data.payload.parts) {
                        const textPart = fullMessage.data.payload.parts.find(p => p.mimeType === 'text/plain');
                        if (textPart && textPart.body.data) {
                            bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
                        }
                    }

                    // Create or get thread
                    const threadResult = await query(
                        `INSERT INTO email_threads (org_id, mailbox_id, subject, participants, message_count, last_message_at)
             VALUES ($1, $2, $3, $4, 1, $5)
             ON CONFLICT (org_id, mailbox_id, subject) 
             DO UPDATE SET message_count = email_threads.message_count + 1, last_message_at = $5
             RETURNING id`,
                        [user.org_id, mailbox.id, subject, [from, to], new Date(date)]
                    );

                    const threadId = threadResult.rows[0].id;

                    // Insert message
                    await query(
                        `INSERT INTO email_messages (org_id, thread_id, mailbox_id, message_id, from_address, to_addresses, subject, body_text, received_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (message_id) DO NOTHING`,
                        [
                            user.org_id,
                            threadId,
                            mailbox.id,
                            msg.id,
                            from,
                            [to],
                            subject,
                            bodyText,
                            new Date(date),
                        ]
                    );

                    synced++;
                } catch (msgError) {
                    console.error('Error syncing message:', msgError);
                }
            }

            // Update sync cursor
            await query(
                `UPDATE mailboxes SET sync_cursor = $1, last_synced_at = NOW() WHERE id = $2`,
                [Math.floor(Date.now() / 1000).toString(), mailbox.id]
            );

            // Log activity
            await query(
                `INSERT INTO user_activity (org_id, user_id, activity_type, description)
         VALUES ($1, $2, 'email_synced', $3)`,
                [user.org_id, user.id, `Synced ${synced} emails from ${mailbox.email_address}`]
            );

            return NextResponse.json({
                success: true,
                synced,
                total: messages.length,
            });
        }

        return NextResponse.json(
            { error: 'IMAP sync not yet implemented' },
            { status: 501 }
        );
    } catch (error) {
        console.error('Email sync error:', error);
        return NextResponse.json(
            { error: 'Failed to sync emails' },
            { status: 500 }
        );
    }
}
