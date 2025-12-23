/**
 * Email Integration (SMTP/IMAP)
 * Actions: send_email, check_emails
 */

import nodemailer from 'nodemailer';

export const emailIntegration = {
    name: 'Email',

    /**
     * Send an email via SMTP
     */
    async send_email(credentials, config) {
        const { host, port, user, pass, secure } = credentials;
        const { to, subject, html } = config;

        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: secure === true || secure === 'true',
            auth: { user, pass }
        });

        const info = await transporter.sendMail({
            from: user,
            to,
            subject,
            html
        });

        return {
            success: true,
            message_id: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected
        };
    },

    /**
     * Check for new emails using IMAP
     */
    async check_emails(credentials, config) {
        const { user, pass, imapHost, imapPort, imapTls } = credentials;

        // Dynamic import to avoid build issues if library missing
        const imap = require('imap-simple');
        const simpleParser = require('mailparser').simpleParser;

        const imapConfig = {
            imap: {
                user,
                password: pass,
                host: imapHost || 'imap.gmail.com',
                port: imapPort || 993,
                tls: imapTls !== false,
                authTimeout: 3000
            }
        };

        let connection;
        try {
            connection = await imap.connect(imapConfig);
            await connection.openBox('INBOX');

            const searchCriteria = ['UNSEEN'];
            const fetchOptions = {
                bodies: ['HEADER', 'TEXT', ''],
                markSeen: true
            };

            const messages = await connection.search(searchCriteria, fetchOptions);
            const emails = [];

            for (const item of messages) {
                const all = item.parts.find(part => part.which === '');
                const id = item.attributes.uid;
                const idHeader = "Imap-Id: " + id + "\r\n";

                const parsed = await simpleParser(idHeader + all.body);

                emails.push({
                    id: id,
                    subject: parsed.subject,
                    from: parsed.from.text,
                    to: parsed.to.text,
                    date: parsed.date,
                    text: parsed.text,
                    html: parsed.html || parsed.textAsHtml
                });
            }

            connection.end();
            return { emails };

        } catch (error) {
            if (connection) {
                try { connection.end(); } catch (e) { }
            }
            throw error;
        }
    },

    async get_stats(credentials) {
        // Email stats would require querying application database for sent/received counts
        // For now, return placeholder
        return {
            sent: { total: 'Available in email stream' },
            received: { total: 'Available in email stream' },
            note: 'Email statistics are available in the Email Stream page'
        };
    }
};
