import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const normalizeEnv = (value?: string | null) =>
    (value || "").trim().replace(/^["']|["']$/g, "");

const getAppBaseUrl = (requestUrl: string) => {
    const configuredBase =
        normalizeEnv(process.env.NEXTAUTH_URL) ||
        normalizeEnv(process.env.NEXT_PUBLIC_APP_URL);

    if (configuredBase) return configuredBase;

    const vercelUrl = normalizeEnv(process.env.VERCEL_URL);
    if (vercelUrl) {
        return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
    }

    try {
        return new URL(requestUrl).origin;
    } catch {
        return "";
    }
};

export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    const baseUrl = getAppBaseUrl(req.url) || 'http://localhost:3000';

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

        if (!profileRes.ok || !profileData.sub) {
            console.error('LinkedIn profile error:', profileData);
            return NextResponse.redirect(`${baseUrl}/connections?error=linkedin_profile_failed`);
        }

        const displayName = profileData.name || profileData.email || 'LinkedIn Profile';
        const linkedinSub = profileData.sub;

        // Keep a single active LinkedIn connection per user so reconnect replaces stale tokens.
        await prisma.externalConnection.deleteMany({
            where: { userId, provider: 'linkedin' },
        });

        // Add personal profile
        await prisma.externalConnection.create({
            data: {
                userId,
                provider: 'linkedin',
                name: displayName,
                credentials: JSON.stringify({
                    accessToken: tokenData.access_token,
                    expiresIn: tokenData.expires_in,
                    username: `urn:li:person:${linkedinSub}`,
                    connectedAt: new Date().toISOString(),
                }),
            },
        });

        // Try to fetch organization pages the user manages
        try {
            const orgsRes = await fetch('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&state=APPROVED', {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
            });
            if (orgsRes.ok) {
                const orgsData = await orgsRes.json();
                const elements = orgsData.elements || [];
                
                for (const org of elements) {
                    const orgUrn = org.organization;
                    const orgId = orgUrn.split(':').pop();
                    
                    let orgName = `[Page] ${orgId}`;
                    try {
                        const orgDetailRes = await fetch(`https://api.linkedin.com/v2/organizations/${orgId}`, {
                            headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
                        });
                        if (orgDetailRes.ok) {
                            const orgDetail = await orgDetailRes.json();
                            if (orgDetail.localizedName) {
                                orgName = `[Page] ${orgDetail.localizedName}`;
                            }
                        }
                    } catch (e) {
                        // ignore error fetching organization details
                    }

                    await prisma.externalConnection.create({
                        data: {
                            userId,
                            provider: 'linkedin',
                            name: orgName,
                            credentials: JSON.stringify({
                                accessToken: tokenData.access_token,
                                expiresIn: tokenData.expires_in,
                                username: orgUrn,
                                connectedAt: new Date().toISOString(),
                            }),
                        },
                    });
                }
            } else {
                console.error('LinkedIn organizations fetch failed:', await orgsRes.text());
            }
        } catch (e) {
            console.error('Error processing LinkedIn organizations:', e);
        }

        return NextResponse.redirect(`${baseUrl}/connections?success=linkedin`);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'linkedin_callback_failed';
        console.error('LinkedIn callback error:', err);
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(errorMessage)}`);
    }
}
