import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// TODO: Add Persona model to Prisma Schema
// For now, return default personas or use a JSON field in User settings if implemented
const defaultPersonas = [
    { id: '1', name: 'Professional', prompt: 'You are a professional social media manager. Tone: Formal and informative.' },
    { id: '2', name: 'Witty', prompt: 'You are a witty tech blogger. Tone: Humorous and engaging.' },
];

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    return NextResponse.json(defaultPersonas);
}
