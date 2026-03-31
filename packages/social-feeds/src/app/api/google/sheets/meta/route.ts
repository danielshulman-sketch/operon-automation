import { NextResponse } from 'next/server';
import { getApiAuthContext, unauthorizedJson } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

type GoogleCreds = {
    accessToken?: string | null;
    refreshToken?: string | null;
    expiresAt?: number | null;
    [key: string]: unknown;
};

function normalizeSpreadsheetId(input: string) {
    const trimmed = input.trim();
    const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match?.[1]) return match[1];
    return trimmed;
}

function parseCredentials(raw: string): GoogleCreds {
    try {
        return JSON.parse(raw || "{}");
    } catch {
        return {};
    }
}

function isLikelyGoogleApiKey(token: string): boolean {
    return /^AIza[0-9A-Za-z_-]{20,}$/.test(token);
}

function normalizeEnv(value: string | undefined): string {
    if (!value) return "";
    return value.trim().replace(/^["']|["']$/g, "");
}

function normalizeAccessToken(creds: GoogleCreds): string {
    const token = typeof creds.accessToken === "string" ? creds.accessToken.trim() : "";
    if (!token || isLikelyGoogleApiKey(token)) return "";
    return token;
}

function hasSheetsScope(creds: GoogleCreds): boolean {
    const scope = typeof creds.scope === "string" ? creds.scope : "";
    if (!scope) return false;
    return scope.includes("https://www.googleapis.com/auth/spreadsheets")
        || scope.includes("https://www.googleapis.com/auth/spreadsheets.readonly");
}

function isTokenFresh(creds: GoogleCreds): boolean {
    const expiresAt = typeof creds.expiresAt === "number" ? creds.expiresAt : 0;
    if (!expiresAt) return true;
    return expiresAt > (Date.now() + 60_000);
}

async function refreshGoogleAccessToken(connectionId: string, creds: GoogleCreds): Promise<string | null> {
    const refreshToken = typeof creds.refreshToken === "string" ? creds.refreshToken.trim() : "";
    if (!refreshToken) return null;

    const clientId = normalizeEnv(process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_SHEETS_CLIENT_ID);
    const clientSecret = normalizeEnv(process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SHEETS_CLIENT_SECRET);
    if (!clientId || !clientSecret) return null;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }),
    });
    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenData.access_token) return null;

    const nextCreds = {
        ...creds,
        accessToken: tokenData.access_token as string,
        expiresAt: Date.now() + ((tokenData.expires_in || 3600) * 1000),
    };
    await prisma.externalConnection.update({
        where: { id: connectionId },
        data: { credentials: JSON.stringify(nextCreds) },
    });

    return typeof nextCreds.accessToken === "string" ? nextCreds.accessToken : null;
}

export async function GET(req: Request) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedJson();

    const { searchParams } = new URL(req.url);
    const spreadsheetIdInput = searchParams.get("spreadsheetId");

    if (!spreadsheetIdInput) {
        return NextResponse.json({ error: "Spreadsheet ID is required" }, { status: 400 });
    }

    try {
        const spreadsheetId = normalizeSpreadsheetId(spreadsheetIdInput);

        const connections = await prisma.externalConnection.findMany({
            where: { userId: auth.userId, provider: "google" },
            orderBy: { updatedAt: "desc" },
        });

        if (!connections.length) {
            return NextResponse.json({ error: "Google account not connected." }, { status: 400 });
        }

        const candidates = connections
            .map((connection) => {
                const creds = parseCredentials(connection.credentials);
                const token = normalizeAccessToken(creds);
                const refreshToken = typeof creds.refreshToken === "string" ? creds.refreshToken.trim() : "";
                const usable = !!token || !!refreshToken;
                return { connection, creds, usable, hasSheetsScope: hasSheetsScope(creds) };
            })
            .filter((item) => item.usable)
            .sort((a, b) => {
                if (a.hasSheetsScope === b.hasSheetsScope) return 0;
                return a.hasSheetsScope ? -1 : 1;
            });

        if (!candidates.length) {
            return NextResponse.json({ error: "No valid Google OAuth connection found. Please reconnect Google Sheets." }, { status: 400 });
        }

        let lastError = "Failed to fetch sheets";
        for (const candidate of candidates) {
            let accessToken = normalizeAccessToken(candidate.creds);

            if (!accessToken || !isTokenFresh(candidate.creds)) {
                const refreshed = await refreshGoogleAccessToken(candidate.connection.id, candidate.creds);
                if (refreshed) accessToken = refreshed;
            }

            if (!accessToken) continue;

            let response = await fetch(
                "https://sheets.googleapis.com/v4/spreadsheets/" + spreadsheetId + "?fields=sheets.properties.title",
                { headers: { Authorization: "Bearer " + accessToken } }
            );

            if (response.status === 401) {
                const refreshed = await refreshGoogleAccessToken(candidate.connection.id, candidate.creds);
                if (refreshed) {
                    response = await fetch(
                        "https://sheets.googleapis.com/v4/spreadsheets/" + spreadsheetId + "?fields=sheets.properties.title",
                        { headers: { Authorization: "Bearer " + refreshed } }
                    );
                }
            }

            if (response.ok) {
                const data = await response.json();
                const sheets = data.sheets?.map((s: any) => s.properties.title) || [];
                return NextResponse.json({ sheets });
            }

            const errorPayload = await response.json().catch(() => ({} as any));
            const message = errorPayload?.error?.message || response.statusText || "Failed to fetch sheets";
            lastError = message;

            const lower = String(message).toLowerCase();
            const isAuthError = response.status === 401
                || lower.includes("insufficient authentication scopes")
                || lower.includes("invalid authentication credentials");
            if (!isAuthError) {
                return NextResponse.json({ error: message }, { status: response.status });
            }
        }

        return NextResponse.json(
            { error: `${lastError}. Reconnect Google Sheets and grant Sheets access.` },
            { status: 400 }
        );

    } catch (error) {
        console.error("Error fetching sheet metadata:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
