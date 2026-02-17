import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
/* import { getUserSubscription } from "@/lib/subscription"; */

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const workflows = await prisma.workflow.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' }
    });

    // Parse JSON strings back to objects
    const parsedWorkflows = workflows.map(wf => ({
        ...wf,
        definition: wf.definition ? JSON.parse(wf.definition) : {}
    }));

    return NextResponse.json(parsedWorkflows);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { name, definition } = body;

    /*
    // Optional: Check subscription limit
    const count = await prisma.workflow.count({ where: { userId: session.user.id } });
    const subscription = await getUserSubscription(session.user.id);
    const isPro = !!subscription?.isValid;
    
    if (!isPro && count >= 1) {
         return new NextResponse("Upgrade required for more workflows", { status: 403 });
    }
    */

    const workflow = await prisma.workflow.create({
        data: {
            userId: session.user.id,
            name: name || "Untitled Workflow",
            definition: definition ? (typeof definition === 'string' ? definition : JSON.stringify(definition)) : "{}",
            isActive: false
        }
    });

    return NextResponse.json(workflow);
}
