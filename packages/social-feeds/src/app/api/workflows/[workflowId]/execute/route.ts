import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeWorkflow } from "@/lib/executeWorkflow";

export async function POST(req: Request, props: { params: Promise<{ workflowId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const result = await executeWorkflow(params.workflowId, session.user.id, "manual");
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Workflow execution error:", error);
        return NextResponse.json({ error: error.message || "Execution failed" }, { status: 500 });
    }
}
