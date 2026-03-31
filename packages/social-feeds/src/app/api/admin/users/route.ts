import { NextResponse } from "next/server";
import { forbiddenText, getApiAuthContext, unauthorizedText } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedText();
    if (auth.role !== "admin") return forbiddenText();

    try {
        const users = await prisma.user.findMany({
            include: {
                subscription: true,
                _count: {
                    select: { workflows: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Mask passwords and sensitive data
        const safeUsers = users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            image: u.image,
            createdAt: u.createdAt,
            workflowCount: u._count.workflows,
            subscription: u.subscription
                ? {
                    status: u.subscription.status,
                    plan: u.subscription.priceId,
                }
                : null,
        }));

        return NextResponse.json(safeUsers);
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
