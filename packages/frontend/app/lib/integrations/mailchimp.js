
/**
 * Mailchimp Integration
 * https://mailchimp.com/developer/marketing/api/
 */

export const mailchimpIntegration = {
    add_member: async (credentials, config) => {
        const { apiKey, serverPrefix } = credentials;
        const { listId, email, status = 'subscribed' } = config;

        if (!apiKey || !serverPrefix || !listId || !email) {
            throw new Error('Missing required Mailchimp configuration');
        }

        const response = await fetch(`https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`, {
            method: 'POST',
            headers: {
                'Authorization': `apikey ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email_address: email,
                status: status
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle "Member Exists" error gracefully if needed, or throw
            if (data.title === 'Member Exists') {
                return { success: true, memberId: 'existing', message: 'Member already exists' };
            }
            throw new Error(`Mailchimp Error: ${data.detail || data.title}`);
        }

        return { success: true, memberId: data.id };
    },

    send_campaign: async (credentials, config) => {
        const { apiKey, serverPrefix } = credentials;
        const { campaignId } = config;

        if (!apiKey || !serverPrefix || !campaignId) {
            throw new Error('Missing required Mailchimp configuration');
        }

        const response = await fetch(`https://${serverPrefix}.api.mailchimp.com/3.0/campaigns/${campaignId}/actions/send`, {
            method: 'POST',
            headers: {
                'Authorization': `apikey ${apiKey}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(`Mailchimp Error: ${data.detail || data.title}`);
        }

        return { success: true, campaignId };
    },

    create_campaign: async (credentials, config) => {
        const { apiKey, serverPrefix } = credentials;
        const { listId, subject, fromName, replyTo, title } = config;

        if (!apiKey || !serverPrefix || !listId || !subject || !fromName || !replyTo) {
            throw new Error('Missing required Mailchimp configuration to create a campaign');
        }

        const response = await fetch(`https://${serverPrefix}.api.mailchimp.com/3.0/campaigns`, {
            method: 'POST',
            headers: {
                'Authorization': `apikey ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'regular',
                recipients: {
                    list_id: listId
                },
                settings: {
                    subject_line: subject,
                    title: title || subject,
                    from_name: fromName,
                    reply_to: replyTo
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Mailchimp Error: ${data.detail || data.title}`);
        }

        return { success: true, campaignId: data.id };
    },

    add_tag: async (credentials, config) => {
        const { apiKey, serverPrefix } = credentials;
        const { listId, email, tagName } = config;

        if (!apiKey || !serverPrefix || !listId || !email || !tagName) {
            throw new Error('Missing required Mailchimp configuration to add a tag');
        }

        const subscriberHash = Buffer.from(email.toLowerCase()).toString('hex');

        const response = await fetch(`https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}/tags`, {
            method: 'POST',
            headers: {
                'Authorization': `apikey ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tags: [{ name: tagName, status: 'active' }]
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(`Mailchimp Error: ${data.detail || data.title}`);
        }

        return { success: true };
    },

    get_stats: async (credentials) => {
        const { apiKey, serverPrefix } = credentials;

        try {
            // Fetch lists
            const listsResponse = await fetch(`https://${serverPrefix}.api.mailchimp.com/3.0/lists`, {
                headers: { 'Authorization': `apikey ${apiKey}` }
            });
            const listsData = await listsResponse.json();

            // Fetch campaigns
            const campaignsResponse = await fetch(`https://${serverPrefix}.api.mailchimp.com/3.0/campaigns?count=100`, {
                headers: { 'Authorization': `apikey ${apiKey}` }
            });
            const campaignsData = await campaignsResponse.json();

            const totalSubscribers = (listsData.lists || []).reduce((sum, list) =>
                sum + (list.stats?.member_count || 0), 0
            );

            const avgOpenRate = (listsData.lists || []).reduce((sum, list) =>
                sum + (list.stats?.open_rate || 0), 0) / (listsData.lists?.length || 1);

            return {
                lists: {
                    total: listsData.total_items || 0,
                    subscriber_count: totalSubscribers
                },
                campaigns: {
                    total: campaignsData.total_items || 0,
                    sent: (campaignsData.campaigns || []).filter(c => c.status === 'sent').length,
                    draft: (campaignsData.campaigns || []).filter(c => c.status === 'save').length
                },
                engagement: {
                    avg_open_rate: Math.round(avgOpenRate * 100) / 100
                }
            };
        } catch (error) {
            console.error('Mailchimp stats error:', error);
            throw new Error(`Failed to fetch Mailchimp statistics: ${error.message}`);
        }
    }
};
