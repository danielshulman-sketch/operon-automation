
/**
 * MailerLite Integration
 * https://developers.mailerlite.com/docs/
 */

export const mailerliteIntegration = {
    create_subscriber: async (credentials, config) => {
        const { apiKey } = credentials;
        const { email, name } = config;

        if (!apiKey || !email) throw new Error('Using MailerLite requires Email and API Key');

        const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                fields: name ? { name } : {}
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(`MailerLite Error: ${data.message}`);

        return { success: true, subscriberId: data.data.id };
    },

    add_to_group: async (credentials, config) => {
        const { apiKey } = credentials;
        const { email, groupId } = config;

        const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                groups: [groupId]
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(`MailerLite Error: ${data.message}`);

        return { success: true };
    },

    remove_from_group: async (credentials, config) => {
        const { apiKey } = credentials;
        const { subscriberId, groupId } = config;

        if (!subscriberId || !groupId) {
            throw new Error('MailerLite requires subscriberId and groupId to remove from a group');
        }

        const response = await fetch(`https://connect.mailerlite.com/api/groups/${groupId}/subscribers/${subscriberId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(`MailerLite Error: ${data.message}`);
        }

        return { success: true };
    },

    update_subscriber: async (credentials, config) => {
        const { apiKey } = credentials;
        const { subscriberId, email, fields } = config;

        if (!subscriberId) throw new Error('MailerLite requires subscriberId to update');

        const response = await fetch(`https://connect.mailerlite.com/api/subscribers/${subscriberId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                fields
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(`MailerLite Error: ${data.message}`);

        return { success: true, subscriberId: data.data.id };
    },

    /**
     * Get MailerLite account statistics
     */
    get_stats: async (credentials) => {
        const { apiKey } = credentials;

        if (!apiKey) {
            throw new Error('MailerLite API key is required');
        }

        try {
            // Fetch subscribers stats
            const subscribersResponse = await fetch('https://connect.mailerlite.com/api/subscribers?limit=1', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!subscribersResponse.ok) {
                throw new Error('Failed to fetch subscribers');
            }

            const subscribersData = await subscribersResponse.json();

            // Fetch groups
            const groupsResponse = await fetch('https://connect.mailerlite.com/api/groups', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const groupsData = await groupsResponse.json();

            // Fetch campaigns
            const campaignsResponse = await fetch('https://connect.mailerlite.com/api/campaigns?limit=10', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const campaignsData = await campaignsResponse.json();

            return {
                subscribers: {
                    total: subscribersData.meta?.total || 0,
                    active: subscribersData.meta?.active || 0,
                    unsubscribed: subscribersData.meta?.unsubscribed || 0,
                    unconfirmed: subscribersData.meta?.unconfirmed || 0
                },
                groups: {
                    total: groupsData.data?.length || 0,
                    list: (groupsData.data || []).map(g => ({
                        id: g.id,
                        name: g.name,
                        active_count: g.active_count || 0,
                        sent_count: g.sent_count || 0
                    }))
                },
                campaigns: {
                    total: campaignsData.meta?.total || 0,
                    sent: (campaignsData.data || []).filter(c => c.status === 'sent').length,
                    draft: (campaignsData.data || []).filter(c => c.status === 'draft').length,
                    recent: (campaignsData.data || []).slice(0, 5).map(c => ({
                        id: c.id,
                        name: c.name,
                        status: c.status,
                        created_at: c.created_at,
                        type: c.type
                    }))
                }
            };
        } catch (error) {
            console.error('MailerLite stats error:', error);
            throw new Error(`Failed to fetch MailerLite statistics: ${error.message}`);
        }
    }
};
