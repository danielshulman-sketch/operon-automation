
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        if (process.env.DISABLE_EMAIL_AUTOSYNC !== '1') {
            const { initEmailSyncScheduler } = await import('./app/lib/email-sync-scheduler');
            initEmailSyncScheduler();
            console.log('Email auto-sync scheduler enabled');
        } else {
            console.log('Email auto-sync scheduler disabled via env');
        }
    }
}
