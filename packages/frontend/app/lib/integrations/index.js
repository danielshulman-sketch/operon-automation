/**
 * Integration Registry
 * Central registry of all available integrations
 */

export const INTEGRATIONS = {
    slack: {
        name: 'Slack',
        description: 'Send messages and manage channels',
        icon: '💬',
        authType: 'oauth2',
        color: '#4A154B',
        actions: ['send_message', 'create_channel'],
        oauth: {
            authUrl: 'https://slack.com/oauth/v2/authorize',
            tokenUrl: 'https://slack.com/api/oauth.v2.access',
            scopes: ['chat:write', 'channels:manage']
        }
    },

    google_sheets: {
        name: 'Google Sheets',
        description: 'Read and write spreadsheet data',
        icon: '📊',
        authType: 'oauth2',
        color: '#0F9D58',
        actions: ['read_rows', 'append_row', 'create_sheet'],
        oauth: {
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        }
    },

    notion: {
        name: 'Notion',
        description: 'Create and update pages and databases',
        icon: '📝',
        authType: 'oauth2',
        color: '#000000',
        actions: ['create_page', 'update_database'],
        oauth: {
            authUrl: 'https://api.notion.com/v1/oauth/authorize',
            tokenUrl: 'https://api.notion.com/v1/oauth/token',
            scopes: []
        }
    },

    stripe: {
        name: 'Stripe',
        description: 'Process payments and manage customers',
        icon: '💳',
        authType: 'api_key',
        color: '#635BFF',
        actions: ['create_customer', 'create_payment']
    },

    email: {
        name: 'Email (SMTP/IMAP)',
        description: 'Send and receive emails',
        icon: '📧',
        authType: 'smtp',
        color: '#EA4335',
        actions: ['send_email', 'check_emails']
    }
};

/**
 * Get integration by name
 */
export function getIntegration(name) {
    return INTEGRATIONS[name] || null;
}

/**
 * Get all integrations as array
 */
export function getAllIntegrations() {
    return Object.entries(INTEGRATIONS).map(([key, value]) => ({
        id: key,
        ...value
    }));
}

/**
 * Check if integration exists
 */
export function isValidIntegration(name) {
    return name in INTEGRATIONS;
}
