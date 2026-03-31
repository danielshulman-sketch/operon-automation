import { NextResponse } from "next/server";
import { getApiAuthContext, unauthorizedJson } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedJson();

    const connections = await prisma.externalConnection.findMany({
        where: { userId: auth.userId, provider: 'linkedin' }
    });

    const results = [];

    for (const conn of connections) {
        let creds: any = {};
        try { creds = JSON.parse(conn.credentials); } catch { }

        const tokenPreview = creds.accessToken
            ? `${creds.accessToken.substring(0, 10)}...${creds.accessToken.substring(creds.accessToken.length - 4)}`
            : 'NO TOKEN';

        const result: any = {
            connectionId: conn.id,
            name: conn.name,
            createdAt: conn.createdAt,
            tokenPreview,
            tokenLength: creds.accessToken?.length || 0,
            hasUsername: !!creds.username,
            connectedAt: creds.connectedAt || 'unknown',
            expiresIn: creds.expiresIn || 'unknown',
        };

        // Test the token
        if (creds.accessToken) {
            try {
                const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
                    headers: { 'Authorization': `Bearer ${creds.accessToken}` },
                });
                const profileData = await profileRes.json();
                result.profileTest = {
                    status: profileRes.status,
                    ok: profileRes.ok,
                    data: profileData,
                };
            } catch (err: any) {
                result.profileTest = { error: err.message };
            }

            // Also try /v2/me endpoint
            try {
                const meRes = await fetch('https://api.linkedin.com/v2/me', {
                    headers: { 'Authorization': `Bearer ${creds.accessToken}` },
                });
                const meData = await meRes.json();
                result.meTest = {
                    status: meRes.status,
                    ok: meRes.ok,
                    data: meData,
                };
            } catch (err: any) {
                result.meTest = { error: err.message };
            }
        }

        results.push(result);
    }

    return NextResponse.json({
        totalConnections: connections.length,
        results,
    });
}
