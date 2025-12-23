import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        apiKey: process.env.OPENAI_API_KEY ?
            `${process.env.OPENAI_API_KEY.substring(0, 10)}...` :
            'NOT SET'
    });
}
