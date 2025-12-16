import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

export async function POST(request) {
    try {
        const user = await requireAuth(request);
        const { mailboxId } = await request.json();

        if (!mailboxId) {
            return NextResponse.json(
                { error: 'Mailbox ID is required' },
                { status: 400 }
            );
        }

        // Get mailbox credentials
        const mailboxResult = await query(
            `SELECT * FROM mailboxes WHERE id = $1 AND org_id = $2`,
            [mailboxId, user.org_id]
        );

        if (mailboxResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Mailbox not found' },
                { status: 404 }
            );
        }

        const mailbox = mailboxResult.rows[0];
        const password = Buffer.from(mailbox.password_encrypted, 'base64').toString();

        // Create IMAP connection
        const imap = new Imap({
            user: mailbox.email_address,
            password: password,
            host: mailbox.imap_host,
            port: mailbox.imap_port,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
        });

        return new Promise((resolve) => {
            let emailCount = 0;
            const emails = [];

            imap.once('ready', () => {
                imap.openBox('INBOX', false, (err, box) => {
                    if (err) {
                        resolve(NextResponse.json({ error: 'Failed to open inbox' }, { status: 500 }));
                        return;
                    }

                    // Fetch last 50 emails
                    const fetchCount = Math.min(50, box.messages.total);
                    if (fetchCount === 0) {
                        imap.end();
                        resolve(NextResponse.json({
                            success: true,
                            emailCount: 0,
                            message: 'No emails found'
                        }));
                        return;
                    }

                    const fetch = imap.seq.fetch(`${box.messages.total - fetchCount + 1}:*`, {
                        bodies: '',
                        struct: true,
                    });

                    fetch.on('message', (msg) => {
                        msg.on('body', (stream) => {
                            simpleParser(stream, async (err, parsed) => {
                                if (err) {
                                    console.error('Parse error:', err);
                                    return;
                                }

                                try {
                                    // Check if email already exists
                                    const existing = await query(
                                        'SELECT id FROM email_messages WHERE message_id = $1',
                                        [parsed.messageId]
                                    );

                                    if (existing.rows.length === 0) {
                                        // Insert new email
                                        await query(
                                            `INSERT INTO email_messages (
                        org_id, mailbox_id, message_id, from_address, from_name,
                        to_address, subject, body_text, body_html, received_at, is_read
                      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)`,
                                            [
                                                user.org_id,
                                                mailboxId,
                                                parsed.messageId || `${Date.now()}-${Math.random()}`,
                                                parsed.from?.value?.[0]?.address || '',
                                                parsed.from?.value?.[0]?.name || '',
                                                parsed.to?.value?.[0]?.address || '',
                                                parsed.subject || '(No Subject)',
                                                parsed.text || '',
                                                parsed.html || '',
                                                parsed.date || new Date(),
                                            ]
                                        );
                                        emailCount++;
                                        emails.push({
                                            from: parsed.from?.value?.[0]?.address,
                                            subject: parsed.subject,
                                            date: parsed.date,
                                        });
                                    }
                                } catch (dbErr) {
                                    console.error('Database error:', dbErr);
                                }
                            });
                        });
                    });

                    fetch.once('end', async () => {
                        imap.end();

                        // Update last sync time
                        await query(
                            'UPDATE mailboxes SET last_sync_at = NOW() WHERE id = $1',
                            [mailboxId]
                        );

                        // Log activity
                        await query(
                            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
               VALUES ($1, $2, 'email_synced', $3)`,
                            [user.org_id, user.id, `Synced ${emailCount} emails from ${mailbox.email_address}`]
                        );

                        resolve(NextResponse.json({
                            success: true,
                            emailCount,
                            emails: emails.slice(0, 10), // Return first 10 for preview
                            message: `Successfully synced ${emailCount} emails`,
                        }));
                    });
                });
            });

            imap.once('error', (err) => {
                console.error('IMAP error:', err);
                resolve(NextResponse.json(
                    { error: `IMAP connection failed: ${err.message}` },
                    { status: 500 }
                ));
            });

            imap.connect();
        });
    } catch (error) {
        console.error('Email sync error:', error);
        return NextResponse.json(
            { error: 'Failed to sync emails' },
            { status: 500 }
        );
    }
}
