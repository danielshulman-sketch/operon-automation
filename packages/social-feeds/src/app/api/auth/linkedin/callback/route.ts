import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    if (error) {
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_params`);
    }

    let userId: string;
    try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        userId = decoded.userId;
    } catch {
        return NextResponse.redirect(`${baseUrl}/connections?error=invalid_state`);
    }

    // Read user's LinkedIn credentials from DB
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { linkedinClientId: true, linkedinClientSecret: true },
    });

    if (!user?.linkedinClientId || !user?.linkedinClientSecret) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_linkedin_config`);
    }

    const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;

    try {
        // Exchange code for access token
        const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: user.linkedinClientId,
                client_secret: user.linkedinClientSecret,
            }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.access_token) {
            console.error('LinkedIn token error:', tokenData);
            return NextResponse.redirect(`${baseUrl}/connections?error=token_failed`);
        }

        // Get user profile
        const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        });
        const profileData = await profileRes.json();

        const displayName = profileData.name || profileData.email || 'LinkedIn Profile';
        const linkedinSub = profileData.sub || '';

        // Save connection
        await prisma.externalConnection.create({
            data: {
                userId,
                provider: 'linkedin',
                name: displayName,
                credentials: JSON.stringify({
                    accessToken: tokenData.access_token,
                    expiresIn: tokenData.expires_in,
                    username: linkedinSub,
                    connectedAt: new Date().toISOString(),
                }),
            },
        });

        return NextResponse.redirect(`${baseUrl}/connections?success=linkedin`);
    } catch (err: any) {
        console.error('LinkedIn callback error:', err);
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(err.message)}`);
    }
}
