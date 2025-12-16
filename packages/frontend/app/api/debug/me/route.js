import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';

export async function GET(request) {
    try {
        const user = await requireAuth(request);

        return NextResponse.json({
            user,
            hasSuperadmin: !!user.is_superadmin,
            superadminValue: user.is_superadmin,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 401 }
        );
    }
}
