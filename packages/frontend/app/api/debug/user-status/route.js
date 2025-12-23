import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';

export async function GET(request) {
    try {
        const user = await requireAuth(request);

        return NextResponse.json({
            userId: user.id,
            email: user.email,
            orgId: user.org_id,
            isAdmin: user.is_admin,
            isSuperadmin: user.is_superadmin,
            role: user.role,
            isActive: user.is_active
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }
}
