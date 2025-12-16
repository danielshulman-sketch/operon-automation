import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { requireAuth } from '@/utils/auth';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/email/oauth/google/callback`
);

export async function GET(request) {
    try {
        await requireAuth(request);

        const scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/gmail.compose',
            'https://www.googleapis.com/auth/gmail.send',
        ];

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
        });

        return NextResponse.json({ authUrl });
    } catch (error) {
        console.error('OAuth init error:', error);
        return NextResponse.json(
            { error: 'Failed to initialize OAuth' },
            { status: 500 }
        );
    }
}
