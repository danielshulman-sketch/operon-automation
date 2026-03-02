import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    if (error) {
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(errorDescription || error)}`);
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

    const prismaUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { facebookAppId: true, facebookAppSecret: true }
    });

    let appId = prismaUser?.facebookAppId;
    let appSecret = prismaUser?.facebookAppSecret;

    appId = appId || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID;
    appSecret = appSecret || process.env.FACEBOOK_APP_SECRET || process.env.FACEBOOK_PAGE_SECRET;

    if (!appId || !appSecret || appId.trim() === '' || appSecret.trim() === '') {
        return NextResponse.redirect(`${baseUrl}/settings?error=missing_facebook_config`);
    }

    const redirectUri = `${baseUrl}/api/auth/facebook/callback`;

    try {
        // 1. Exchange code for access token
        const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`);

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.access_token) {
            console.error('Facebook token error:', tokenData);
            return NextResponse.redirect(`${baseUrl}/connections?error=token_failed`);
        }

        const userAccessToken = tokenData.access_token;

        // 2. Exchange for a long-lived user token
        const longTokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${userAccessToken}`);
        const longTokenData = await longTokenRes.json();
        const finalUserToken = longTokenData.access_token || userAccessToken;

        // 3. Fetch user's pages
        const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${finalUserToken}&fields=id,name,access_token,instagram_business_account`);
        const pagesData = await pagesRes.json();

        if (!pagesRes.ok) {
            console.error('Facebook fetch pages error:', pagesData);
            return NextResponse.redirect(`${baseUrl}/connections?error=fetch_pages_failed`);
        }

        let addedCount = 0;
        let igAddedCount = 0;

        // 4. Save each page to database
        const pages = pagesData.data || [];
        for (const page of pages) {
            if (page.id && page.name && page.access_token) {
                // Delete existing FB page connection if it exists to avoid duplicates
                await prisma.externalConnection.deleteMany({
                    where: {
                        userId,
                        provider: 'facebook',
                        name: page.name
                    }
                });

                // Save Facebook Page Connection using the long-lived Page Access Token
                await prisma.externalConnection.create({
                    data: {
                        userId,
                        provider: 'facebook',
                        name: page.name,
                        credentials: JSON.stringify({
                            accessToken: page.access_token,
                            pageId: page.id,
                            connectedAt: new Date().toISOString()
                        }),
                    },
                });
                addedCount++;

                // 5. If it has a linked Instagram Business Account, save that too
                if (page.instagram_business_account && page.instagram_business_account.id) {
                    const igName = `IG linked to ${page.name}`;

                    // Delete existing IG connection to avoid duplicates
                    await prisma.externalConnection.deleteMany({
                        where: {
                            userId,
                            provider: 'instagram',
                            name: igName
                        }
                    });

                    await prisma.externalConnection.create({
                        data: {
                            userId,
                            provider: 'instagram',
                            name: igName,
                            credentials: JSON.stringify({
                                accessToken: page.access_token, // IG Graph uses the FB Page Access Token
                                username: page.instagram_business_account.id, // Using the IG ID as username
                                connectedAt: new Date().toISOString()
                            }),
                        },
                    });
                    igAddedCount++;
                }
            }
        }

        return NextResponse.redirect(`${baseUrl}/connections?success=facebook&added=${addedCount}&igAdded=${igAddedCount}`);
    } catch (err: any) {
        console.error('Facebook callback error:', err);
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(err.message)}`);
    }
}
