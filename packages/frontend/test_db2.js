const { Pool } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\danie\\OneDrive\\Documents\\app  builds\\New folder\\packages\\frontend\\.env' });
const { decryptValue } = require('./app/lib/automation/encryption');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    const res = await pool.query("SELECT * FROM integration_credentials WHERE integration_name = 'facebook_page'");
    if (res.rows.length > 0) {
      console.log('Found records:', res.rows.length);
      const creds = JSON.parse(decryptValue(res.rows[0].credentials));
      console.log('Decrypted access token length:', creds.access_token ? creds.access_token.length : 'MISSING');
      console.log('Token data:', JSON.stringify(creds).substring(0, 500));
    } else {
      console.log('No facebook_page credentials found');
    }
  } catch (err) {
    console.error('Error querying DB:', err.message);
  } finally {
    pool.end();
  }
}

run();
