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
    }
};
