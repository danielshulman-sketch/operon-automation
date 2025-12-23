import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { query } from './db';
import { ensureSuperadminColumn } from './ensure-superadmin-column';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function hashPassword(password) {
    return await argon2.hash(password);
}

export async function verifyPassword(hash, password) {
    return await argon2.verify(hash, password);
}

export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

export async function getUserFromToken(token) {
    console.log('[getUserFromToken] Starting, token length:', token?.length);
    const payload = verifyToken(token);
    console.log('[getUserFromToken] Payload:', payload ? 'exists' : 'null');

    if (!payload || !payload.userId) {
        console.log('[getUserFromToken] No payload or userId');
        return null;
    }

    await ensureSuperadminColumn();

    const result = await query(
        `SELECT u.*, om.org_id, om.role, om.is_admin, om.is_active, 
                COALESCE(u.is_superadmin, false) as is_superadmin
         FROM users u
         JOIN org_members om ON u.id = om.user_id
         WHERE u.id = $1 AND om.is_active = true
         LIMIT 1`,
        [payload.userId]
    );

    console.log('[getUserFromToken] Query result rows:', result.rows.length);
    return result.rows[0] || null;
}

export async function requireAuth(request) {
    console.log('[requireAuth] Starting...');
    const authHeader = request.headers.get('authorization');
    console.log('[requireAuth] Auth header exists:', !!authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[requireAuth] No valid auth header');
        throw new Error('Unauthorized');
    }

    const token = authHeader.substring(7);
    console.log('[requireAuth] Token extracted, length:', token.length);

    const user = await getUserFromToken(token);
    console.log('[requireAuth] User from token:', user ? user.id : 'null');

    if (!user) {
        console.log('[requireAuth] No user found');
        throw new Error('Unauthorized');
    }

    console.log('[requireAuth] Success!');
    return user;
}

export async function requireAdmin(request) {
    const user = await requireAuth(request);

    if (!user.is_admin && !user.is_superadmin) {
        throw new Error('Admin access required');
    }

    return user;
}

export async function requireSuperAdmin(request) {
    const user = await requireAuth(request);

    if (!user.is_superadmin) {
        throw new Error('Superadmin access required');
    }

    return user;
}
