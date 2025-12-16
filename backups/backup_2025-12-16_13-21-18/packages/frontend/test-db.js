const { Pool } = require('pg');

const pool = new Pool({
    host: 'db.ywcqavarzxcgcoptwfkv.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Dcdefe367e4e4.',
    ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Connection successful!');
        console.log('Server time:', res.rows[0].now);
        process.exit(0);
    }
});
