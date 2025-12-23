const Imap = require('imap');

// Test IMAP connection for daniel@easy-ai.co.uk
const imap = new Imap({
    user: 'daniel@easy-ai.co.uk',
    password: 'Dcdefe367e4e4...', // Replace with actual password
    host: 'imap.ipage.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
});

console.log('Connecting to IMAP server...');

imap.once('ready', () => {
    console.log('✓ IMAP connection successful!');

    imap.openBox('INBOX', false, (err, box) => {
        if (err) {
            console.error('✗ Failed to open inbox:', err.message);
            imap.end();
            return;
        }

        console.log(`✓ Inbox opened successfully`);
        console.log(`  Total messages: ${box.messages.total}`);
        console.log(`  New messages: ${box.messages.new}`);
        console.log(`  Unseen messages: ${box.messages.unseen}`);

        imap.end();
    });
});

imap.once('error', (err) => {
    console.error('✗ IMAP connection error:', err.message);
});

imap.once('end', () => {
    console.log('Connection closed');
});

imap.connect();
