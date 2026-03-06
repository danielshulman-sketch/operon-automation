const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_3MXBC4SgAOrT@ep-steep-snow-ab9vp6aw-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    let out = "Starting query...\n";
    try {
        const res = await pool.query(`SELECT id, provider, name, credentials, "createdAt" FROM "ExternalConnection" ORDER BY "createdAt" DESC`);
        out += `Found ${res.rowCount} connections total.\n`;
        for (const row of res.rows) {
            out += `[${row.provider}] ${row.name} (ID: ${row.id})\n`;
            out += `Created: ${row.createdAt}\n`;
            out += `Length: ${row.credentials.length}\n`;
            out += `Value: ${row.credentials}\n`;
            out += '---\n';
        }
    } catch (e) {
        out += `Error: ${e.message}\n`;
    }

    fs.writeFileSync('c:\\Users\\danie\\OneDrive\\Documents\\app  builds\\New folder\\db_dump.txt', out);
    console.log("Done");
    await pool.end();
}

run().catch(console.error);
