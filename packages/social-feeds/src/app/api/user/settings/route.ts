import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET user settings (including masked API key)
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, openaiApiKey: true, linkedinClientId: true, linkedinClientSecret: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
        name: user.name,
        email: user.email,
        hasOpenaiKey: !!user.openaiApiKey,
        openaiKeyPreview: user.openaiApiKey
            ? `sk-...${user.openaiApiKey.slice(-4)}`
            : null,
        hasLinkedinCredentials: !!(user.linkedinClientId && user.linkedinClientSecret),
        linkedinClientId: user.linkedinClientId || '',
    });
}

// PUT update user settings
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.openaiApiKey !== undefined) updateData.openaiApiKey = body.openaiApiKey;
    if (body.linkedinClientId !== undefined) updateData.linkedinClientId = body.linkedinClientId;
    if (body.linkedinClientSecret !== undefined) updateData.linkedinClientSecret = body.linkedinClientSecret;

    const user = await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
    });

    return NextResponse.json({
        success: true,
        name: user.name,
        hasOpenaiKey: !!user.openaiApiKey,
    });
}

// POST test LinkedIn connections
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    if (body.action === 'test-linkedin') {
        const connections = await prisma.externalConnection.findMany({
            where: { userId: session.user.id, provider: 'linkedin' }
        });

        const results = [];
        for (const conn of connections) {
            let creds: any = {};
            try { creds = JSON.parse(conn.credentials); } catch { }

            const tokenPreview = creds.accessToken
                ? `${creds.accessToken.substring(0, 10)}...${creds.accessToken.slice(-4)}`
                : 'NO TOKEN';

            const result: any = {
                connectionId: conn.id,
                name: conn.name,
                createdAt: conn.createdAt,
                tokenPreview,
                tokenLength: creds.accessToken?.length || 0,
                connectedAt: creds.connectedAt || 'unknown',
                expiresIn: creds.expiresIn || 'unknown',
            };

            if (creds.accessToken) {
                try {
                    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
                        headers: { 'Authorization': `Bearer ${creds.accessToken}` },
                    });
                    result.userinfoTest = {
                        status: profileRes.status,
                        data: await profileRes.json(),
                    };
                } catch (err: any) {
                    result.userinfoTest = { error: err.message };
                }

                try {
                    const meRes = await fetch('https://api.linkedin.com/v2/me', {
                        headers: { 'Authorization': `Bearer ${creds.accessToken}` },
                    });
                    result.meTest = {
                        status: meRes.status,
                        data: await meRes.json(),
                    };
                } catch (err: any) {
                    result.meTest = { error: err.message };
                }
            }
            results.push(result);
        }

        return NextResponse.json({
            totalConnections: connections.length,
            debug: {
                NEXTAUTH_URL: process.env.NEXTAUTH_URL,
                NEXTAUTH_URL_LENGTH: process.env.NEXTAUTH_URL?.length,
                VERCEL_URL: process.env.VERCEL_URL,
            },
            results
        });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
