const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function resetDatabase() {
    console.log('⚠️  WARNING: This will delete ALL data in the database!');
    console.log('Starting database reset in 3 seconds...');

    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        console.log('\n1. Dropping existing mailboxes table...');
        await pool.query('DROP TABLE IF EXISTS mailboxes CASCADE');
        console.log('✓ Dropped mailboxes table');

        console.log('\n2. Creating mailboxes table with correct schema...');
        await pool.query(`
            CREATE TABLE mailboxes (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                connection_type VARCHAR(50) NOT NULL DEFAULT 'imap',
                email_address VARCHAR(255) NOT NULL,
                imap_host VARCHAR(255),
                imap_port INTEGER DEFAULT 993,
                smtp_host VARCHAR(255),
                smtp_port INTEGER DEFAULT 465,
                username VARCHAR(255),
                password_encrypted TEXT,
                use_ssl BOOLEAN DEFAULT true,
                sync_cursor TEXT,
                last_synced_at TIMESTAMPTZ,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        console.log('✓ Created mailboxes table');

        console.log('\n3. Creating indexes...');
        await pool.query('CREATE INDEX idx_mailboxes_org_user ON mailboxes(org_id, user_id)');
        await pool.query('CREATE INDEX idx_mailboxes_email ON mailboxes(email_address)');
        console.log('✓ Created indexes');

        console.log('\n✅ Database reset complete!');
        console.log('\nNext steps:');
        console.log('1. Go to http://localhost:3001/dashboard/settings');
        console.log('2. Click "Add Email Account"');
        console.log('3. Enter your email credentials again');
        console.log('4. Click "Sync Now"');
        console.log('5. Check the Email Stream for your 358 emails!');

    } catch (error) {
        console.error('\n❌ Error resetting database:', error.message);
        console.error(error);
    } finally {
        await pool.end();
    }
}

resetDatabase();
