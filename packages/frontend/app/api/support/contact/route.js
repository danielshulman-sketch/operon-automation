import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getUserFromToken } from '@/utils/auth';

const SUPPORT_EMAIL = 'daniel@easy-ai.co.uk';

const {
    SUPPORT_SMTP_HOST,
    SUPPORT_SMTP_PORT,
    SUPPORT_SMTP_USER,
    SUPPORT_SMTP_PASS,
    SUPPORT_EMAIL_FROM,
} = process.env;

function ensureTransportConfig() {
    if (!SUPPORT_SMTP_HOST || !SUPPORT_SMTP_PORT || !SUPPORT_SMTP_USER || !SUPPORT_SMTP_PASS) {
        throw new Error('Support email is not configured. Please set the SMTP environment variables.');
    }
}

async function resolveUser(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);
    try {
        return await getUserFromToken(token);
    } catch {
        return null;
    }
}

export async function POST(request) {
    try {
        ensureTransportConfig();

        const user = await resolveUser(request);
        const body = await request.json();

        const name = body?.name?.trim() || user?.first_name || 'Anonymous user';
        const email = body?.email?.trim() || user?.email;
        const message = body?.message?.trim();

        if (!email) {
            return NextResponse.json(
                { error: 'A reply email is required so we can contact you back.' },
                { status: 400 }
            );
        }

        if (!message) {
            return NextResponse.json(
                { error: 'Please include a short message so we know how to help.' },
                { status: 400 }
            );
        }

        const transporter = nodemailer.createTransport({
            host: SUPPORT_SMTP_HOST,
            port: Number(SUPPORT_SMTP_PORT),
            secure: Number(SUPPORT_SMTP_PORT) === 465,
            auth: {
                user: SUPPORT_SMTP_USER,
                pass: SUPPORT_SMTP_PASS,
            },
        });

        const html = `
            <h2>Help request from Operon</h2>
            <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
            <p><strong>User ID:</strong> ${user?.id || 'Anonymous'}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br/>')}</p>
        `;

        await transporter.sendMail({
            from: SUPPORT_EMAIL_FROM || SUPPORT_SMTP_USER,
            to: SUPPORT_EMAIL,
            subject: `Operon support request from ${name}`,
            replyTo: email,
            html,
            text: `From: ${name} <${email}>\nUser ID: ${user?.id || 'Anonymous'}\n\n${message}`,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Support contact error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send support request.' },
            { status: 500 }
        );
    }
}
