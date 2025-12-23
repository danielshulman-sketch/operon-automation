import bcrypt from 'bcryptjs';
import { query } from './app/utils/db.js';

async function resetPassword() {
    const email = 'daniel.shulman@gmail.com';
    const newPassword = 'Dcdefe356e4e4';

    try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        console.log('Hashed password:', passwordHash);

        // Find the user
        const userResult = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            console.error('User not found!');
            return;
        }

        const userId = userResult.rows[0].id;
        console.log('Found user ID:', userId);

        // Update the password in auth_accounts
        await query(
            `UPDATE auth_accounts 
             SET password_hash = $1 
             WHERE user_id = $2 AND provider = 'email'`,
            [passwordHash, userId]
        );

        console.log('✓ Password updated successfully!');
        console.log('You can now log in with:');
        console.log('Email:', email);
        console.log('Password: Dcdefe356e4e4');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetPassword();
