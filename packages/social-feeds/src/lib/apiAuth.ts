import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ApiAuthContext = {
    userId: string;
    email: string;
    role: string;
    source: "session" | "workflow";
};

const normalizeEnv = (value?: string | null) =>
    (value || "").trim().replace(/^["']|["']$/g, "");

const getWorkflowSecret = () =>
    normalizeEnv(process.env.WORKFLOW_INTERNAL_SECRET || process.env.CRON_SECRET);

async function findUserBySession(session: any) {
    const userId = normalizeEnv(session?.user?.id);
    const email = normalizeEnv(session?.user?.email);

    if (!userId && !email) return null;

    if (userId) {
        return prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true },
        });
    }

    return prisma.user.findFirst({
        where: {
            email: {
                equals: email,
                mode: "insensitive",
            },
        },
        select: { id: true, email: true, role: true },
    });
}

export async function getApiAuthContext(req?: Request): Promise<ApiAuthContext | null> {
    const session = await getServerSession(authOptions);
    const sessionUser = await findUserBySession(session);

    if (sessionUser) {
        return {
            userId: sessionUser.id,
            email: sessionUser.email,
            role: sessionUser.role,
            source: "session",
        };
    }

    if (!req) return null;

    const configuredSecret = getWorkflowSecret();
    const requestSecret = normalizeEnv(req.headers.get("x-workflow-secret"));
    const requestUserId = normalizeEnv(req.headers.get("x-workflow-user-id"));

    if (!configuredSecret || !requestSecret || requestSecret !== configuredSecret || !requestUserId) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { id: requestUserId },
        select: { id: true, email: true, role: true },
    });

    if (!user) return null;

    return {
        userId: user.id,
        email: user.email,
        role: user.role,
        source: "workflow",
    };
}

export const unauthorizedJson = (message = "Unauthorized") =>
    NextResponse.json({ error: message }, { status: 401 });

export const unauthorizedText = (message = "Unauthorized") =>
    new NextResponse(message, { status: 401 });

export const forbiddenText = (message = "Forbidden") =>
    new NextResponse(message, { status: 403 });
