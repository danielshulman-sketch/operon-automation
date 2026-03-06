const { Pool } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\danie\\OneDrive\\Documents\\app  builds\\New folder\\packages\\social-feeds\\.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    const res = await pool.query("SELECT * FROM integration_credentials WHERE integration_name = 'facebook_page'");
    if (res.rows.length > 0) {
      console.log('Found records:', res.rows.length);
      console.log('Raw credentials length:', res.rows[0].credentials.length);
    } else {
      console.log('No facebook_page credentials found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
