import Imap from 'imap';
import { google } from 'googleapis';
import { simpleParser } from 'mailparser';
import { query } from '@/utils/db';
import { classifyEmail, generateDraft } from '@/utils/openai';
import { ensureAutoDraftSettingsTable } from '@/utils/ensure-auto-draft-settings';

const parseCategories = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
        return JSON.parse(value);
    } catch (error) {
        return [];
    }
};

const getAutoDraftSettings = async (user) => {
    await ensureAutoDraftSettingsTable();
    const result = await query(
        `SELECT enabled, categories
         FROM user_auto_draft_settings
         WHERE user_id = $1 AND org_id = $2
         LIMIT 1`,
        [user.id, user.org_id]
    );

    if (result.rows.length === 0) {
        return { enabled: false, categories: [] };
    }

    return {
        enabled: Boolean(result.rows[0].enabled),
        categories: parseCategories(result.rows[0].categories),
    };
};

const insertEmailMessage = async ({
    orgId,
    mailboxId,
    messageId,
    fromAddress,
    subject,
    bodyText,
    bodyHtml,
    receivedAt,
}) => {
    try {
        const result = await query(
            `INSERT INTO email_messages (
                org_id,
                mailbox_id,
                message_id,
                from_address,
                subject,
                body_text,
                body_html,
                received_at,
                is_read
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false)
            ON CONFLICT (message_id) DO NOTHING
            RETURNING id`,
            [
                orgId,
                mailboxId,
                messageId,
                fromAddress,
                subject,
                bodyText,
                bodyHtml,
                receivedAt,
            ]
        );

        return result.rows[0]?.id || null;
    } catch (err) {
        console.error('Insert email error:', err.message);
        return null;
    }
};

const finalizeMailboxSync = async (mailbox, user, emailCount) => {
    try {
        await query('UPDATE mailboxes SET is_active = true WHERE id = $1', [mailbox.id]);
    } catch (err) {
        console.error('Finalize sync error:', err.message);
    }

    try {
        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
             VALUES ($1, $2, 'email_synced', $3)`,
            [user.org_id, user.id, `Synced ${emailCount} emails from ${mailbox.email_address}`]
        );
    } catch (err) {
        console.error('Activity log error:', err.message);
    }
};

const buildHeaderMap = (headers) =>
    headers.reduce((acc, header) => {
        acc[header.name.toLowerCase()] = header.value;
        return acc;
    }, {});

const decodeGmailBody = (data) => {
    if (!data) return '';
    const buffer = Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    return buffer.toString('utf-8');
};

const extractGmailBody = (payload, mimeType) => {
    if (!payload) return '';

    if (payload.mimeType === mimeType && payload.body?.data) {
        return decodeGmailBody(payload.body.data);
    }

    if (payload.parts && payload.parts.length > 0) {
        for (const part of payload.parts) {
            const content = extractGmailBody(part, mimeType);
            if (content) {
                return content;
            }
        }
    }

    if (!mimeType && payload.body?.data) {
        return decodeGmailBody(payload.body.data);
    }

    return '';
};

const classifyAndSave = async (emailId, emailContent, user) => {
    try {
        const classification = await classifyEmail(emailContent, { orgId: user.org_id });

        await query(
            'UPDATE email_messages SET classification = $1 WHERE id = $2',
            [classification.classification, emailId]
        );

        try {
            const settings = await getAutoDraftSettings(user);
            const categories = settings.categories || [];
            const shouldAutoDraft =
                settings.enabled &&
                categories.includes(classification.classification);

            if (shouldAutoDraft) {
                const existingDraft = await query(
                    `SELECT id FROM email_drafts WHERE reply_to_message_id = $1 AND user_id = $2 LIMIT 1`,
                    [emailId, user.id]
                );

                if (existingDraft.rows.length === 0) {
                    const voiceProfileResult = await query(
                        `SELECT * FROM voice_profiles WHERE user_id = $1 AND is_trained = true LIMIT 1`,
                        [user.id]
                    );

                    const voiceProfile = voiceProfileResult.rows[0] || null;
                    if (voiceProfile) {
                        const draft = await generateDraft(emailContent, voiceProfile, { orgId: user.org_id });
                        await query(
                            `INSERT INTO email_drafts (org_id, user_id, reply_to_message_id, subject, body)
                             VALUES ($1, $2, $3, $4, $5)`,
                            [user.org_id, user.id, emailId, draft.subject, draft.body]
                        );
                    }
                }
            }
        } catch (draftError) {
            console.error(`Auto draft generation failed for email ${emailId}:`, draftError);
        }

        if (classification.tasks && classification.tasks.length > 0) {
            for (const task of classification.tasks) {
                await query(
                    `INSERT INTO detected_tasks (org_id, user_id, email_message_id, title, description, priority, due_date, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
                    [
                        user.org_id,
                        user.id,
                        emailId,
                        task.title,
                        task.description || null,
                        task.priority || 'medium',
                        task.due_date ? new Date(task.due_date) : null,
                    ]
                );
            }
        }
    } catch (err) {
        console.error(`Classification failed for email ${emailId}:`, err);
    }
};

export async function syncMailbox(mailbox, user) {
    const password = mailbox.password_encrypted
        ? Buffer.from(mailbox.password_encrypted, 'base64').toString()
        : null;

    const imap = new Imap({
        user: mailbox.email_address,
        password: password || '',
        host: mailbox.imap_host,
        port: mailbox.imap_port || 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
    });

    return new Promise((resolve, reject) => {
        let emailCount = 0;
        const emails = [];

        imap.once('ready', () => {
            imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    reject(new Error('Failed to open inbox'));
                    return;
                }

                const fetchCount = Math.min(50, box.messages.total);
                if (fetchCount === 0) {
                    imap.end();
                    resolve({ emailCount: 0, emails: [] });
                    return;
                }

                const fetch = imap.seq.fetch(`${box.messages.total - fetchCount + 1}:*`, {
                    bodies: '',
                    struct: true,
                });

                fetch.on('message', (msg) => {
                    msg.on('body', (stream) => {
                        simpleParser(stream, async (parseErr, parsed) => {
                            if (parseErr) {
                                console.error('Parse error:', parseErr);
                                return;
                            }

                            try {
                                const existing = await query(
                                    'SELECT id FROM email_messages WHERE message_id = $1',
                                    [parsed.messageId]
                                );

                                if (existing.rows.length === 0) {
                                    const insertedId = await insertEmailMessage({
                                        orgId: user.org_id,
                                        mailboxId: mailbox.id,
                                        messageId: parsed.messageId || `${Date.now()}-${Math.random()}`,
                                        fromAddress: parsed.from?.value?.[0]?.address || '',
                                        subject: parsed.subject || '(No Subject)',
                                        bodyText: parsed.text || '',
                                        bodyHtml: parsed.html || '',
                                        receivedAt: parsed.date || new Date(),
                                    });

                                    if (insertedId) {
                                        emailCount++;
                                        emails.push({
                                            from: parsed.from?.value?.[0]?.address,
                                            subject: parsed.subject,
                                            date: parsed.date,
                                        });

                                        const emailContent = `From: ${parsed.from?.value?.[0]?.address}\nSubject: ${parsed.subject}\n\n${parsed.text?.substring(0, 1000) || ''}`;
                                        await classifyAndSave(insertedId, emailContent, user);
                                    }
                                }
                            } catch (dbErr) {
                                console.error('Database error:', dbErr);
                            }
                        });
                    });
                });

                fetch.once('end', async () => {
                    imap.end();
                    await finalizeMailboxSync(mailbox, user, emailCount);
                    resolve({ emailCount, emails });
                });
            });
        });

        imap.once('error', (err) => {
            reject(new Error(`IMAP connection failed: ${err.message}`));
        });

        imap.connect();
    });
}

export async function syncGmailMailbox(mailbox, user) {
    const tokenResult = await query(
        `SELECT access_token, refresh_token, token_expires_at 
         FROM oauth_connections 
         WHERE org_id = $1 AND user_id = $2 AND provider = 'gmail'`,
        [user.org_id, user.id]
    );

    if (tokenResult.rows.length === 0) {
        throw new Error('No Gmail OAuth credentials found for this mailbox');
    }

    const credentials = tokenResult.rows[0];
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/email/oauth/google/callback`
    );

    oauth2Client.setCredentials({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || undefined,
        expiry_date: credentials.token_expires_at ? new Date(credentials.token_expires_at).getTime() : undefined,
    });

    oauth2Client.on('tokens', async (tokens) => {
        try {
            await query(
                `UPDATE oauth_connections 
                 SET access_token = COALESCE($1, access_token),
                     refresh_token = COALESCE($2, refresh_token),
                     token_expires_at = COALESCE($3, token_expires_at),
                     updated_at = NOW()
                 WHERE org_id = $4 AND user_id = $5 AND provider = 'gmail'`,
                [
                    tokens.access_token || null,
                    tokens.refresh_token || null,
                    tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                    user.org_id,
                    user.id,
                ]
            );
        } catch (tokenErr) {
            console.error('Failed to persist refreshed Gmail tokens:', tokenErr);
        }
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const listResponse = await gmail.users.messages.list({
        userId: 'me',
        labelIds: ['INBOX'],
        maxResults: 50,
    });

    const messages = listResponse.data.messages || [];
    let emailCount = 0;
    const emails = [];

    for (const message of messages) {
        const fullMessage = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full',
        });

        const headers = buildHeaderMap(fullMessage.data.payload?.headers || []);
        const bodyText = extractGmailBody(fullMessage.data.payload, 'text/plain');

        const insertedId = await insertEmailMessage({
            orgId: user.org_id,
            mailboxId: mailbox.id,
            messageId: fullMessage.data.id,
            fromAddress: headers.from || '',
            subject: headers.subject || '(No Subject)',
            bodyText: bodyText,
            bodyHtml: extractGmailBody(fullMessage.data.payload, 'text/html'),
            receivedAt: headers.date ? new Date(headers.date) : new Date(),
        });

        if (insertedId) {
            emailCount++;
            emails.push({
                from: headers.from || '',
                subject: headers.subject || '(No Subject)',
                date: headers.date ? new Date(headers.date) : new Date(),
            });

            const emailContent = `From: ${headers.from || ''}\nSubject: ${headers.subject || ''}\n\n${bodyText?.substring(0, 1000) || ''}`;
            await classifyAndSave(insertedId, emailContent, user);
        }
    }

    await finalizeMailboxSync(mailbox, user, emailCount);
    return { emailCount, emails };
}

export async function syncMailboxesForUser(user) {
    const mailboxesResult = await query(
        `SELECT id, org_id, user_id, email_address, imap_host, imap_port, smtp_host, smtp_port, password_encrypted, is_active, connection_type
         FROM mailboxes
         WHERE org_id = $1 AND user_id = $2 AND is_active = true`,
        [user.org_id, user.id]
    );

    const results = [];
    for (const mailbox of mailboxesResult.rows) {
        if (mailbox.connection_type === 'gmail') {
            results.push(await syncGmailMailbox(mailbox, user));
        } else {
            results.push(await syncMailbox(mailbox, user));
        }
    }

    return results;
}
