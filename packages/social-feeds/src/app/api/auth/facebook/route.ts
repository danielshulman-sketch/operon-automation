import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const normalizeEnv = (value?: string | null) =>
    (value || "").trim().replace(/^["']|["']$/g, "");

const isPlaceholder = (value: string) => {
    const normalized = value.toLowerCase();
    return normalized.includes("your_fb_app_id_here")
        || normalized.includes("your_fb_app_secret_here")
        || normalized.includes("your_facebook_app_id")
        || normalized.includes("your_facebook_app_secret");
};

export async function GET(req: Request) {
    const requestUrl = new URL(req.url);
    const requestOrigin = requestUrl.origin;
    const baseUrl = normalizeEnv(process.env.NEXTAUTH_URL) || requestOrigin;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', baseUrl));
    }

    const prismaUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { facebookAppId: true }
    });

    const userAppId = normalizeEnv(prismaUser?.facebookAppId);
    const envAppId = normalizeEnv(process.env.NEXT_PUBLIC_FACEBOOK_APP_ID) || normalizeEnv(process.env.FACEBOOK_APP_ID);
    // User's own app ID takes priority, falls back to environment variable
    const appId = userAppId || envAppId;

    if (!appId || isPlaceholder(appId)) {
        return NextResponse.redirect(`${baseUrl}/settings?error=missing_facebook_config`);
    }

    const redirectUri = `${baseUrl}/api/auth/facebook/callback`;
    const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString('base64');

    // Scopes for reading pages, posting, and Instagram
    const scope = 'public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata,instagram_basic,instagram_content_publish';

    const authUrl = new URL('https://www.facebook.com/dialog/oauth');
    authUrl.searchParams.set('client_id', appId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('display', 'page');

    return NextResponse.redirect(authUrl.toString());
}
