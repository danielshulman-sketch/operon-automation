import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user || user.role !== "admin") {
        return new NextResponse("Forbidden", { status: 403 });
    }

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
