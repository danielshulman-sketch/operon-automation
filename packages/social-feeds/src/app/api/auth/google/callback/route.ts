import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const normalizeEnv = (value?: string) =>
    (value || "").trim().replace(/^["']|["']$/g, "");

const getAppBaseUrl = (requestUrl: string) => {
    const configuredBase =
        normalizeEnv(process.env.NEXTAUTH_URL) ||
        normalizeEnv(process.env.NEXT_PUBLIC_APP_URL);

    if (configuredBase) return configuredBase;

    const productionUrl = normalizeEnv(process.env.VERCEL_PROJECT_PRODUCTION_URL);
    if (productionUrl) {
        return productionUrl.startsWith("http") ? productionUrl : `https://${productionUrl}`;
    }

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
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const baseUrl = getAppBaseUrl(req.url) || "http://localhost:3000";

    if (error) {
        return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent(error)}`);
    }
    if (!code || !state) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_params`);
    }

    const clientId = normalizeEnv(process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_SHEETS_CLIENT_ID);
    const clientSecret = normalizeEnv(process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SHEETS_CLIENT_SECRET);
    if (!clientId || !clientSecret) {
        return NextResponse.redirect(`${baseUrl}/connections?error=missing_google_oauth_config`);
    }

    let userId = "";
    try {
        const decoded = JSON.parse(Buffer.from(state, "base64").toString());
        userId = decoded.userId;
    } catch {
        return NextResponse.redirect(`${baseUrl}/connections?error=invalid_state`);
    }
    if (!userId) {
        return NextResponse.redirect(`${baseUrl}/connections?error=invalid_user`);
    }

    try {
        const redirectUri = `${baseUrl}/api/auth/google/callback`;
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        const tokenData = await tokenRes.json().catch(() => ({}));
        if (!tokenRes.ok || !tokenData.access_token) {
            return NextResponse.redirect(`${baseUrl}/connections?error=google_token_exchange_failed`);
        }

        const grantedScope = typeof tokenData.scope === "string" ? tokenData.scope : "";
        const hasSheetsScope = grantedScope.includes("https://www.googleapis.com/auth/spreadsheets")
            || grantedScope.includes("https://www.googleapis.com/auth/spreadsheets.readonly");
        if (!hasSheetsScope) {
            return NextResponse.redirect(`${baseUrl}/connections?error=google_missing_sheets_scope`);
        }

        let accountEmail: string | null = null;
        let accountName = "Google Sheets";
        try {
            const meRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            const me = await meRes.json().catch(() => ({}));
            accountEmail = me.email || null;
            accountName = me.email || me.name || "Google Sheets";
        } catch {
            // Optional profile lookup only.
        }

        const creds = {
            accessToken: tokenData.access_token as string,
            refreshToken: (tokenData.refresh_token as string | undefined) || null,
            expiresAt: Date.now() + ((tokenData.expires_in || 3600) * 1000),
            scope: grantedScope,
            tokenType: tokenData.token_type || "Bearer",
            email: accountEmail,
            connectedAt: new Date().toISOString(),
        };

        const existing = await prisma.externalConnection.findFirst({
            where: { userId, provider: "google" },
            orderBy: { updatedAt: "desc" },
        });

        if (existing) {
            const prev = JSON.parse(existing.credentials || "{}");
            const prevScope = typeof prev.scope === "string" ? prev.scope : "";
            const prevHasSheetsScope = prevScope.includes("https://www.googleapis.com/auth/spreadsheets")
                || prevScope.includes("https://www.googleapis.com/auth/spreadsheets.readonly");
            const preservedRefreshToken = creds.refreshToken
                || (prevHasSheetsScope ? (prev.refreshToken || null) : null);
            const merged = {
                ...prev,
                ...creds,
                // Preserve prior refresh token only if it already had Sheets scopes.
                refreshToken: preservedRefreshToken,
            };
            await prisma.externalConnection.update({
                where: { id: existing.id },
                data: { name: accountName, credentials: JSON.stringify(merged) },
            });
        } else {
            await prisma.externalConnection.create({
                data: {
                    userId,
                    provider: "google",
                    name: accountName,
                    credentials: JSON.stringify(creds),
                },
            });
        }

        return NextResponse.redirect(`${baseUrl}/connections?success=google`);
    } catch {
        return NextResponse.redirect(`${baseUrl}/connections?error=google_callback_failed`);
    }
}
