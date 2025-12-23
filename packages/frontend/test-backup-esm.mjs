
import { performBackup } from './app/lib/backup.js';

console.log('Testing backup...');
performBackup()
    .then(result => {
        console.log('Backup Result:', result);
        process.exit(0);
    })
    .catch(err => {
        console.error('Backup Error:', err);
        process.exit(1);
    });
