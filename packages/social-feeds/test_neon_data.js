const { Pool } = require('pg');

const oldDbUrl = 'postgresql://neondb_owner:npg_3MXBC4SgAOrT@ep-steep-snow-ab9vp6aw-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
    connectionString: oldDbUrl,
    ssl: { rejectUnauthorized: false }
});

async function checkNeon() {
    try {
        console.log("Testing connection to Neon...");
        const res = await pool.query('SELECT COUNT(*) FROM "Workflow"');
        console.log(`SUCCESS! Found ${res.rows[0].count} workflows in the old database.`);
        
        // Also check if we can actually SELECT the rows, sometimes COUNT works but SELECT fails if quota exceeded
        const workflows = await pool.query('SELECT id, name FROM "Workflow" LIMIT 1');
        if (workflows.rows.length > 0) {
            console.log(`Successfully fetched a workflow: ${workflows.rows[0].name}`);
        } else {
            console.log('No workflows found or could not fetch details.');
        }
        
    } catch (e) {
        console.error('FAIL: ' + e.message);
    } finally {
        await pool.end();
    }
}

checkNeon();
