import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const requestUrl = new URL(req.url);
    const requestOrigin = requestUrl.origin;
    const baseUrl = process.env.NEXTAUTH_URL || requestOrigin;

    if (!session?.user?.id) {
        return NextResponse.redirect(`${baseUrl}/connections?error=unauthorized`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_SHEETS_CLIENT_ID;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    if (!clientId) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_google_oauth_config`);
    }

    const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString("base64");
    const scope = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
        "openid",
        "email",
        "profile",
    ].join(" ");

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scope);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("include_granted_scopes", "true");
    url.searchParams.set("state", state);

    return NextResponse.redirect(url.toString());
}
