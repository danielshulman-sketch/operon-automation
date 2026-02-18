import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const connections = await prisma.externalConnection.findMany({
        where: { userId: session.user.id }
    });

    // Map to store format if needed, or update store to match DB
    // Store expects: { id, platform, name, status, username, accessToken }
    // DB has: { id, provider, name, credentials }

    const formatted = connections.map(c => {
        let details = {};
        try {
            details = JSON.parse(c.credentials);
        } catch (e) { }

        return {
            id: c.id,
            platform: c.provider,
            name: c.name,
            status: 'active', // TODO: check token expiry
            ...details
        };
    });

    return NextResponse.json(formatted);
}

export async function POST(req: Request) {
    console.log("POST /api/connections called");
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            console.log("Unauthorized: No session");
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        console.log("Request body:", body);
        const { platform, name, accessToken, ...other } = body;

        if (!platform || !name || !accessToken) {
            console.log("Missing fields:", { platform, name, accessToken });
            return new NextResponse("Missing fields", { status: 400 });
        }

        console.log("Creating connection in DB...");
        const connection = await prisma.externalConnection.create({
            data: {
                userId: session.user.id,
                provider: platform,
                name: name,
                credentials: JSON.stringify({ accessToken, ...other })
            }
        });
        console.log("Connection created:", connection.id);

        return NextResponse.json(connection);
    } catch (error: any) {
        console.error("Error in POST /api/connections:", error);
        return new NextResponse(error.message || "Internal Server Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return new NextResponse("Missing id", { status: 400 });

    await prisma.externalConnection.delete({
        where: { id, userId: session.user.id }
    });

    return NextResponse.json({ success: true });
}
