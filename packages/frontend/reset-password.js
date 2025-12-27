/**
 * Password Reset Script for daniel@easy-ai.co.uk
 * 
 * Run this with: node reset-password.js
 */

const { Client } = require('pg');
const argon2 = require('argon2');

async function resetPassword() {
    const email = 'daniel@easy-ai.co.uk';
    const newPassword = 'Admin123!';  // Change this to your preferred password

    console.log('Connecting to database...');
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected!');

        // Hash the new password
        console.log('Hashing password...');
        const hashedPassword = await argon2.hash(newPassword);

        // Find the user
        const userResult = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            console.log('User not found!');
            return;
        }

        const userId = userResult.rows[0].id;
        console.log('User found:', userId);

        // Update the password in auth_accounts
        const updateResult = await client.query(
            `UPDATE auth_accounts 
             SET password_hash = $1 
             WHERE user_id = $2 AND provider = 'email'`,
            [hashedPassword, userId]
        );

        if (updateResult.rowCount === 0) {
            console.log('No auth account found, creating one...');
            await client.query(
                `INSERT INTO auth_accounts (user_id, provider, password_hash)
                 VALUES ($1, 'email', $2)`,
                [userId, hashedPassword]
            );
        }

        console.log('✅ Password reset successfully!');
        console.log('Email:', email);
        console.log('New password:', newPassword);
        console.log('\nYou can now sign in at http://localhost:3000');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

resetPassword();
