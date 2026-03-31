import { NextResponse } from "next/server";
import { getApiAuthContext, unauthorizedText } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

const getDuplicateName = async (userId: string, originalName: string) => {
    const trimmedName = originalName.trim() || "Untitled Workflow";
    const copyBase = `${trimmedName} (Copy)`;

    const existing = await prisma.workflow.findMany({
        where: {
            userId,
            OR: [
                { name: copyBase },
                { name: { startsWith: `${trimmedName} (Copy ` } },
            ],
        },
        select: { name: true },
    });

    const existingNames = new Set(existing.map((workflow) => workflow.name));
    if (!existingNames.has(copyBase)) return copyBase;

    let suffix = 2;
    while (existingNames.has(`${trimmedName} (Copy ${suffix})`)) {
        suffix += 1;
    }

    return `${trimmedName} (Copy ${suffix})`;
};

export async function POST(req: Request, props: { params: Promise<{ workflowId: string }> }) {
    const params = await props.params;
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedText();

    const workflow = await prisma.workflow.findUnique({
        where: { id: params.workflowId, userId: auth.userId },
    });

    if (!workflow) {
        return new NextResponse("Not Found", { status: 404 });
    }

    const duplicateName = await getDuplicateName(auth.userId, workflow.name);
    const duplicatedWorkflow = await prisma.workflow.create({
        data: {
            userId: auth.userId,
            name: duplicateName,
            description: workflow.description,
            definition: workflow.definition || "{}",
            accessLevel: workflow.accessLevel,
            isActive: false,
        },
    });

    return NextResponse.json(duplicatedWorkflow);
}
