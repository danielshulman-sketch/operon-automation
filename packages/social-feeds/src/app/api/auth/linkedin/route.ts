import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

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
    const baseUrl = getAppBaseUrl(req.url) || 'http://localhost:3000';
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', baseUrl));
    }

    // Read user's LinkedIn credentials from DB
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { linkedinClientId: true, linkedinClientSecret: true },
    });

    if (!user?.linkedinClientId || !user?.linkedinClientSecret) {
        return NextResponse.json({ error: "LinkedIn credentials not configured. Go to Settings → API Keys to add your LinkedIn Client ID and Secret." }, { status: 400 });
    }

    const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;
    const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString('base64');
    const scope = 'openid profile w_member_social w_organization_social';

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', user.linkedinClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', scope);

    return NextResponse.redirect(authUrl.toString());
}
