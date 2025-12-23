import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { syncMailbox } from '../../../lib/email-sync';

export async function POST(request) {
    console.log('=== EMAIL SYNC REQUEST RECEIVED ===');
    try {
        const user = await requireAuth(request);
        console.log('User authenticated:', user.email);

        const body = await request.json();
        const { mailboxId } = body;
        console.log('Request body:', { mailboxId });

        // If no mailboxId provided, sync all active mailboxes
        if (!mailboxId) {
            console.log('No mailboxId provided, syncing all mailboxes');
            const mailboxesResult = await query(
                `SELECT id, org_id, user_id, email_address, imap_host, smtp_host, password_encrypted, is_active, created_at
                 FROM mailboxes 
                 WHERE org_id = $1 AND is_active = true`,
                [user.org_id]
            );

            console.log(`Found ${mailboxesResult.rows.length} active mailboxes`);

            if (mailboxesResult.rows.length === 0) {
                return NextResponse.json(
                    { error: 'No active mailboxes found. Please connect an email account first.' },
                    { status: 404 }
                );
            }

            // Sync all mailboxes
            let totalEmailCount = 0;
            const results = [];
            const errors = [];

            for (const mailbox of mailboxesResult.rows) {
                try {
                    const result = await syncMailbox(mailbox, user);
                    totalEmailCount += result.emailCount;
                    results.push({
                        mailbox: mailbox.email_address,
                        emailCount: result.emailCount
                    });
                } catch (err) {
                    console.error(`Failed to sync ${mailbox.email_address}:`, err);
                    errors.push({
                        mailbox: mailbox.email_address,
                        error: err.message
                    });
                }
            }

            return NextResponse.json({
                success: true,
                totalEmailCount,
                mailboxesSynced: results.length,
                results,
                errors: errors.length > 0 ? errors : undefined,
                message: `Successfully synced ${totalEmailCount} emails from ${results.length} mailbox(es)`,
            });
        }

        // Single mailbox sync
        const mailboxResult = await query(
            `SELECT id, org_id, user_id, email_address, imap_host, smtp_host, password_encrypted, is_active, created_at
             FROM mailboxes 
             WHERE id = $1 AND org_id = $2`,
            [mailboxId, user.org_id]
        );

        if (mailboxResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Mailbox not found' },
                { status: 404 }
            );
        }

        const mailbox = mailboxResult.rows[0];
        const result = await syncMailbox(mailbox, user);

        return NextResponse.json({
            success: true,
            emailCount: result.emailCount,
            emails: result.emails.slice(0, 10),
            message: `Successfully synced ${result.emailCount} emails`,
        });
    } catch (error) {
        console.error('Email sync error:', error);
        return NextResponse.json(
            { error: 'Failed to sync emails' },
            { status: 500 }
        );
    }
}

