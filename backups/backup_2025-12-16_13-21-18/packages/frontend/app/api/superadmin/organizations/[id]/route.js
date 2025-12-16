import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireSuperAdmin } from '@/utils/auth';

export async function PUT(request) {
    try {
        const superadmin = await requireSuperAdmin(request);
        const { orgId, maxUsers } = await request.json();

        if (!orgId || !maxUsers) {
            return NextResponse.json(
                { error: 'Organization ID and max users are required' },
                { status: 400 }
            );
        }

        if (maxUsers < 1) {
            return NextResponse.json(
                { error: 'Max users must be at least 1' },
                { status: 400 }
            );
        }

        // Update organization max_users
        const result = await query(
            `UPDATE organisations 
       SET max_users = $1 
       WHERE id = $2 
       RETURNING id, name, max_users`,
            [maxUsers, orgId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Organization not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            organization: result.rows[0],
        });
    } catch (error) {
        console.error('Update org limit error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update organization limit' },
            { status: error.message === 'Superadmin access required' ? 403 : 500 }
        );
    }
}
