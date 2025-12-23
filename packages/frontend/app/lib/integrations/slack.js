/**
 * Slack Integration
 * Actions: send_message, create_channel
 */

export const slackIntegration = {
    name: 'Slack',

    /**
     * Send a message to a Slack channel
     */
    async send_message(credentials, config, context) {
        const { channel, message, username } = config;

        if (!channel || !message) {
            throw new Error('Channel and message are required');
        }

        const response = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channel,
                text: message,
                username: username || 'Automation Bot'
            })
        });

        const data = await response.json();

        if (!data.ok) {
            throw new Error(`Slack API error: ${data.error}`);
        }

        return {
            success: true,
            message_ts: data.ts,
            channel: data.channel
        };
    },

    /**
     * Create a new Slack channel
     */
    async create_channel(credentials, config, context) {
        const { name, is_private } = config;

        if (!name) {
            throw new Error('Channel name is required');
        }

        const response = await fetch('https://slack.com/api/conversations.create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
                is_private: is_private || false
            })
        });

        const data = await response.json();

        if (!data.ok) {
            throw new Error(`Slack API error: ${data.error}`);
        }

        return {
            success: true,
            channel_id: data.channel.id,
            channel_name: data.channel.name
        };
    },

    /**
     * Schedule a message to send later
     */
    async schedule_message(credentials, config) {
        const { channel, message, post_at } = config;
        if (!channel || !message || !post_at) {
            throw new Error('Channel, message, and scheduled time are required');
        }

        const response = await fetch('https://slack.com/api/chat.scheduleMessage', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channel,
                text: message,
                post_at: Math.floor(new Date(post_at).getTime() / 1000)
            })
        });

        const data = await response.json();
        if (!data.ok) {
            throw new Error(`Slack API error: ${data.error}`);
        }

        return {
            success: true,
            scheduled_message_id: data.scheduled_message_id,
            channel: data.channel
        };
    },

    /**
     * Invite a user to a channel
     */
    async invite_user(credentials, config) {
        const { channel, user } = config;
        if (!channel || !user) {
            throw new Error('Channel ID and User ID are required');
        }

        const response = await fetch('https://slack.com/api/conversations.invite', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ channel, users: user })
        });

        const data = await response.json();
        if (!data.ok) {
            throw new Error(`Slack API error: ${data.error}`);
        }

        return {
            success: true,
            channel_id: data.channel.id
        };
    },

    /**
     * Get Slack workspace statistics
     */
    async get_stats(credentials) {
        const { access_token } = credentials;

        try {
            // Fetch team info
            const teamResponse = await fetch('https://slack.com/api/team.info', {
                headers: { 'Authorization': `Bearer ${access_token}` }
            });
            const teamData = await teamResponse.json();

            // Fetch channels
            const channelsResponse = await fetch('https://slack.com/api/conversations.list', {
                headers: { 'Authorization': `Bearer ${access_token}` }
            });
            const channelsData = await channelsResponse.json();

            // Fetch users
            const usersResponse = await fetch('https://slack.com/api/users.list', {
                headers: { 'Authorization': `Bearer ${access_token}` }
            });
            const usersData = await usersResponse.json();

            return {
                workspace: {
                    name: teamData.team?.name || 'Unknown',
                    domain: teamData.team?.domain || ''
                },
                channels: {
                    total: channelsData.channels?.length || 0,
                    public: channelsData.channels?.filter(c => !c.is_private).length || 0,
                    private: channelsData.channels?.filter(c => c.is_private).length || 0
                },
                members: {
                    total: usersData.members?.length || 0,
                    active: usersData.members?.filter(m => !m.deleted && !m.is_bot).length || 0
                }
            };
        } catch (error) {
            console.error('Slack stats error:', error);
            throw new Error(`Failed to fetch Slack statistics: ${error.message}`);
        }
    }
};
