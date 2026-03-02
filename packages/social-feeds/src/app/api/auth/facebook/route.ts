import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
    }

    const prismaUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { facebookAppId: true }
    });

    let appId = prismaUser?.facebookAppId;
    appId = appId || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID;

    if (!appId || appId.trim() === '') {
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings?error=missing_facebook_config`);
    }

    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/facebook/callback`;
    const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString('base64');

    // Scopes for reading pages, posting, and Instagram
    const scope = 'public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata,instagram_basic,instagram_content_publish';

    const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
    authUrl.searchParams.set('client_id', appId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('display', 'page');

    return NextResponse.redirect(authUrl.toString());
}
