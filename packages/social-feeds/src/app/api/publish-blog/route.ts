import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext, unauthorizedJson } from "@/lib/apiAuth";
import { publishBlogToEasyAi, type PublishBlogPayload } from "@/lib/publishBlog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedJson();

    try {
        const body = (await req.json()) as PublishBlogPayload;
        const result = await publishBlogToEasyAi(body);
        return NextResponse.json(result.data, { status: result.status });
    } catch (error) {
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Unknown server error",
            },
            { status: 500 }
        );
    }
}
