import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { ensureSuperadminColumn } from '@/utils/ensure-superadmin-column';

export async function GET(request) {
    try {
        await ensureSuperadminColumn();
        // Test user query
        const result = await query(`
            SELECT u.id, u.email, u.first_name, 
                   COALESCE(u.is_superadmin, false) as is_superadmin,
                   om.org_id, om.role, om.is_admin, om.is_active
            FROM users u
            LEFT JOIN org_members om ON u.id = om.user_id
            LIMIT 5
        `);

        return NextResponse.json({
            success: true,
            message: 'User query successful',
            userCount: result.rows.length,
            users: result.rows.map(u => ({
                email: u.email,
                hasOrgMembership: !!u.org_id,
                isActive: u.is_active
            }))
        });
    } catch (error) {
        console.error('User test error:', error);
        return NextResponse.json(
            {
                error: 'User query failed',
                details: error.message,
                code: error.code
            },
            { status: 500 }
        );
    }
}
