
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const spreadsheetId = searchParams.get('spreadsheetId');

    if (!spreadsheetId) {
        return NextResponse.json({ error: 'Spreadsheet ID is required' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { googleApiKey: true } // Assuming this field exists based on previous context
        });

        if (!user?.googleApiKey) {
            return NextResponse.json({ error: 'Google API Key not found in settings' }, { status: 400 });
        }

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${user.googleApiKey}&fields=sheets.properties.title`
        );

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json({ error: error.error?.message || 'Failed to fetch sheets' }, { status: response.status });
        }

        const data = await response.json();
        const sheets = data.sheets?.map((s: any) => s.properties.title) || [];

        return NextResponse.json({ sheets });

    } catch (error) {
        console.error('Error fetching sheet metadata:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
