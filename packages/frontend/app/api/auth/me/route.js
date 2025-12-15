import { NextResponse } from 'next/server';
import { requireAuth } from '../../../utils/auth';

export async function GET(request) {
    try {
        const user = await requireAuth(request);

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                isAdmin: user.is_admin,
                orgId: user.org_id,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }
}
