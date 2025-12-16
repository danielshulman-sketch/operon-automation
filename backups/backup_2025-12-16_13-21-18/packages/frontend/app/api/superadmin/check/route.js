import { NextResponse } from 'next/server';
import { query } from '@/utils/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { error: 'Email parameter required' },
                { status: 400 }
            );
        }

        // Check user details
        const result = await query(
            `SELECT u.id, u.email, u.first_name, u.last_name, 
              COALESCE(u.is_superadmin, false) as is_superadmin,
              om.org_id, om.is_admin, om.role
       FROM users u
       LEFT JOIN org_members om ON u.id = om.user_id
       WHERE u.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            user: result.rows[0],
            allRecords: result.rows
        });
    } catch (error) {
        console.error('Check user error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
