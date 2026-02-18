import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, props: { params: Promise<{ workflowId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const workflow = await prisma.workflow.findUnique({
        where: { id: params.workflowId, userId: session.user.id }
    });

    if (!workflow) return new NextResponse("Not Found", { status: 404 });

    // Parse JSON string back to object
    const parsedWorkflow = {
        ...workflow,
        definition: workflow.definition ? JSON.parse(workflow.definition) : {}
    };

    return NextResponse.json(parsedWorkflow);
}

export async function PUT(req: Request, props: { params: Promise<{ workflowId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    // Ensure we don't accidentally transfer ownership or change ID
    const { id, userId, ...data } = body;

    // Handle SQLite limitation: definition must be a string
    let updateData: any = { ...data };
    if (updateData.definition && typeof updateData.definition !== 'string') {
        updateData.definition = JSON.stringify(updateData.definition);
    }

    const workflow = await prisma.workflow.update({
        where: { id: params.workflowId, userId: session.user.id },
        data: {
            ...updateData,
            updatedAt: new Date()
        }
    });

    return NextResponse.json(workflow);
}

export async function DELETE(req: Request, props: { params: Promise<{ workflowId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    await prisma.workflow.delete({
        where: { id: params.workflowId, userId: session.user.id }
    });

    return NextResponse.json({ success: true });
}
