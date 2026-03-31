import { NextResponse } from "next/server";
import { getApiAuthContext, unauthorizedJson } from "@/lib/apiAuth";
import { executeWorkflow } from "@/lib/executeWorkflow";

export async function POST(req: Request, props: { params: Promise<{ workflowId: string }> }) {
    const params = await props.params;
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedJson();

    try {
        const result = await executeWorkflow(params.workflowId, auth.userId, "manual", req.url);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Workflow execution error:", error);
        return NextResponse.json({ error: error.message || "Execution failed" }, { status: 500 });
    }
}
