const bcrypt = require('bcryptjs');

const password = 'Dcdefe356e4e4';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log('Password hash for Supabase:');
console.log(hash);
console.log('\nRun this SQL in Supabase:');
console.log(`
UPDATE auth_accounts 
SET password_hash = '${hash}'
WHERE user_id = (SELECT id FROM users WHERE email = 'daniel.shulman@gmail.com')
AND provider = 'email';
`);
