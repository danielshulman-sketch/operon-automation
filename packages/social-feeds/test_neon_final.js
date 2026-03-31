const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_3MXBC4SgAOrT@ep-steep-snow-ab9vp6aw-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function test_neon() {
    try {
        const res = await pool.query('SELECT 1');
        console.log('SUCCESS: Connection worked!');
    } catch (e) {
        console.error('FAIL: ' + e.message);
    } finally {
        await pool.end();
    }
}

test_neon();
