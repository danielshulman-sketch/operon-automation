import fs from 'fs';
import path from 'path';
import { getClient } from '../utils/db.js';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUPS_AGE_HOURS = 48;

/**
 * Perform a full database backup to a JSON file
 */
export async function performBackup() {
    console.log('Starting system backup...');
    let client;

    try {
        // Ensure backup directory exists
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.json`;
        const filepath = path.join(BACKUP_DIR, filename);

        client = await getClient();

        // 1. Get all table names
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        const backupData = {
            timestamp: new Date().toISOString(),
            tables: {}
        };

        // 2. Dump each table
        for (const row of tablesResult.rows) {
            const tableName = row.table_name;
            const tableDataResult = await client.query(`SELECT * FROM "${tableName}"`);
            backupData.tables[tableName] = tableDataResult.rows;
        }

        // 3. Write to file
        fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
        console.log(`Backup completed successfully: ${filename}`);

        // 4. Cleanup old backups
        await cleanupOldBackups();

        return { success: true, filepath };

    } catch (error) {
        console.error('Backup failed:', error);
        return { success: false, error: error.message };
    } finally {
        if (client) client.release();
    }
}

/**
 * Remove backups older than MAX_BACKUPS_AGE_HOURS
 */
async function cleanupOldBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR);
        const now = Date.now();
        const maxAgeMs = MAX_BACKUPS_AGE_HOURS * 60 * 60 * 1000;

        for (const file of files) {
            if (!file.endsWith('.json')) continue;

            const filepath = path.join(BACKUP_DIR, file);
            const stats = fs.statSync(filepath);

            if (now - stats.mtimeMs > maxAgeMs) {
                fs.unlinkSync(filepath);
                console.log(`Deleted old backup: ${file}`);
            }
        }
    } catch (error) {
        console.error('Error cleaning up old backups:', error);
    }
}
