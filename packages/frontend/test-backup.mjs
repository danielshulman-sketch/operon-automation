
process.env.DATABASE_URL = 'postgres://postgres:Dcdefe367e4e4.@db.ywcqavarzxcgcoptwfkv.supabase.co:5432/postgres';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('Running manual backup verification with mocked credentials...');

// Dynamic import to ensure env var is set before db.js loads
import('./app/lib/backup.js').then(async (backupModule) => {
    try {
        const result = await backupModule.performBackup();
        console.log('Backup result:', result);
        if (!result.success) process.exit(1);
        process.exit(0);
    } catch (error) {
        console.error('Backup verification failed:', error);
        process.exit(1);
    }
}).catch(err => {
    console.error('Import failed:', err);
    process.exit(1);
});
