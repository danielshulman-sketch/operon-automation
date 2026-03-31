import { NextResponse } from "next/server";
import { getApiAuthContext, unauthorizedText } from "@/lib/apiAuth";
import { getUserSubscription } from "@/lib/subscription";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedText();

    const subscription = await getUserSubscription(auth.userId);

    return NextResponse.json({
        isPro: !!subscription?.isValid,
    });
}
