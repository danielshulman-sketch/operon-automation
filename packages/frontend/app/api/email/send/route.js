import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { ensureEmailRepliesTable } from '@/utils/ensure-email-replies';

const buildRawMessage = ({ from, to, subject, body }) => {
    const normalizedBody = body.replace(/\r?\n/g, '\r\n');
    return [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'Content-Transfer-Encoding: 7bit',
        '',
        normalizedBody,
    ].join('\r\n');
};

const toBase64Url = (input) =>
    Buffer.from(input)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');

const resolveMailbox = async (user, draft) => {
    if (draft.reply_to_message_id) {
        const messageResult = await query(
            `SELECT mailbox_id, from_address
             FROM email_messages
             WHERE id = $1 AND org_id = $2`,
            [draft.reply_to_message_id, user.org_id]
        );
        if (messageResult.rows.length === 0) {
            return { error: 'Original email not found for this draft.' };
        }

        const mailboxResult = await query(
            `SELECT * FROM mailboxes WHERE id = $1 AND org_id = $2`,
            [messageResult.rows[0].mailbox_id, user.org_id]
        );
        if (mailboxResult.rows.length === 0) {
            return { error: 'Mailbox not found for this draft.' };
        }

        return {
            mailbox: mailboxResult.rows[0],
            recipient: messageResult.rows[0].from_address,
        };
    }

    return { error: 'Draft is missing an original email reference.' };
};

const sendWithSmtp = async ({ mailbox, to, subject, body }) => {
    const password = Buffer.from(mailbox.password_encrypted, 'base64').toString();
    const port = mailbox.smtp_port || 587;
    const secure = Number(port) === 465;

    const transporter = nodemailer.createTransport({
        host: mailbox.smtp_host,
        port,
        secure,
        auth: {
            user: mailbox.email_address,
            pass: password,
        },
        tls: { rejectUnauthorized: false },
    });

    const info = await transporter.sendMail({
        from: mailbox.email_address,
        to,
        subject,
        text: body,
    });

    return { externalMessageId: info.messageId || null };
};

const sendWithGmail = async ({ mailbox, to, subject, body }) => {
    const tokenResult = await query(
        `SELECT access_token, refresh_token, token_expires_at
         FROM oauth_connections
         WHERE org_id = $1 AND user_id = $2 AND provider = 'gmail'`,
        [mailbox.org_id, mailbox.user_id]
    );

    if (tokenResult.rows.length === 0) {
        throw new Error('No Gmail OAuth credentials found for this mailbox.');
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
        expiry_date: credentials.token_expires_at
            ? new Date(credentials.token_expires_at).getTime()
            : undefined,
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
                    mailbox.org_id,
                    mailbox.user_id,
                ]
            );
        } catch (error) {
            console.error('Failed to persist refreshed Gmail tokens:', error);
        }
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const rawMessage = buildRawMessage({
        from: mailbox.email_address,
        to,
        subject,
        body,
    });

    const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: toBase64Url(rawMessage),
        },
    });

    return { externalMessageId: response.data?.id || null };
};

export async function POST(request) {
    try {
        const user = await requireAuth(request);
        await ensureEmailRepliesTable();
        const { draft_id } = await request.json();

        if (!draft_id) {
            return NextResponse.json(
                { error: 'Draft ID is required' },
                { status: 400 }
            );
        }

        const draftResult = await query(
            `SELECT * FROM email_drafts WHERE id = $1 AND org_id = $2 AND user_id = $3`,
            [draft_id, user.org_id, user.id]
        );

        if (draftResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Draft not found' },
                { status: 404 }
            );
        }

        const draft = draftResult.rows[0];
        const { mailbox, recipient, error } = await resolveMailbox(user, draft);

        if (error) {
            return NextResponse.json(
                { error },
                { status: 400 }
            );
        }

        let sendResult = { externalMessageId: null };
        if (mailbox.connection_type === 'gmail') {
            sendResult = await sendWithGmail({
                mailbox,
                to: recipient,
                subject: draft.subject || '(No Subject)',
                body: draft.body || '',
            });
        } else if (mailbox.smtp_host) {
            sendResult = await sendWithSmtp({
                mailbox,
                to: recipient,
                subject: draft.subject || '(No Subject)',
                body: draft.body || '',
            });
        } else {
            return NextResponse.json(
                { error: 'No sending method configured for this mailbox.' },
                { status: 400 }
            );
        }

        await query(
            `INSERT INTO email_replies (org_id, user_id, reply_to_message_id, subject, body, sent_via, external_message_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                user.org_id,
                user.id,
                draft.reply_to_message_id,
                draft.subject || '(No Subject)',
                draft.body || '',
                mailbox.connection_type || 'smtp',
                sendResult.externalMessageId,
            ]
        );

        await query(
            `DELETE FROM email_drafts WHERE id = $1`,
            [draft.id]
        );

        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
             VALUES ($1, $2, 'draft_sent', $3)`,
            [user.org_id, user.id, `Sent draft: ${draft.subject || '(No Subject)'}`]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Send draft error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send draft' },
            { status: 500 }
        );
    }
}
