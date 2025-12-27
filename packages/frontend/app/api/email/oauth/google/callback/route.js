import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { query } from '../../../../../utils/db';
import { getUserFromToken } from '../../../../../utils/auth';
import { cookies } from 'next/headers';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/email/oauth/google/callback`
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/email-connect?error=no_code`);
        }

        // Get tokens from Google
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user email from Google
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const profile = await gmail.users.getProfile({ userId: 'me' });
        const emailAddress = profile.data.emailAddress;

        // Get user from cookie/session (simplified - in production use proper session management)
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token')?.value || request.headers.get('authorization')?.substring(7);

        if (!token) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
        }

        const user = await getUserFromToken(token);
        if (!user) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
        }

        // Store OAuth connection
        await query(
            `INSERT INTO oauth_connections (org_id, user_id, provider, access_token, refresh_token, token_expires_at, scopes)
       VALUES ($1, $2, 'gmail', $3, $4, $5, $6)
       ON CONFLICT (org_id, user_id, provider) 
       DO UPDATE SET access_token = $3, refresh_token = $4, token_expires_at = $5, scopes = $6, updated_at = NOW()`,
            [
                user.org_id,
                user.id,
                tokens.access_token,
                tokens.refresh_token || null,
                tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                ['gmail.readonly', 'gmail.modify', 'gmail.compose', 'gmail.send'],
            ]
        );

        // Create mailbox entry
        await query(
            `INSERT INTO mailboxes (org_id, user_id, connection_type, email_address, is_active)
       VALUES ($1, $2, 'gmail', $3, true)
       ON CONFLICT (org_id, user_id, email_address) 
       DO UPDATE SET is_active = true, updated_at = NOW()`,
            [user.org_id, user.id, emailAddress]
        );

        // Log activity
        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
       VALUES ($1, $2, 'email_connected', $3)`,
            [user.org_id, user.id, `Connected Gmail account: ${emailAddress}`]
        );

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/email-stream?success=connected`);
    } catch (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/email-connect?error=oauth_failed`);
    }
}
