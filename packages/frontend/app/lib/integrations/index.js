/**
 * Integration Registry
 * Central registry of all available integrations
 */

export const INTEGRATIONS = {
    slack: {
        name: 'Slack',
        description: 'Send messages and manage channels',
        icon: 'K',
        authType: 'oauth2',
        color: '#4A154B',
        actions: ['send_message', 'create_channel', 'schedule_message', 'invite_user'],
        helpUrl: 'https://api.slack.com/authentication/oauth-v2',
        setupInstructions: '1. Go to https://api.slack.com/apps\n2. Click "Create New App" > "From scratch"\n3. Name your app and select workspace\n4. Go to "OAuth & Permissions"\n5. Add scopes: chat:write, channels:manage\n6. Click "Install to Workspace"',
        oauth: {
            authUrl: 'https://slack.com/oauth/v2/authorize',
            tokenUrl: 'https://slack.com/api/oauth.v2/access',
            scopes: ['chat:write', 'channels:manage']
        },
        actionSchemas: {
            send_message: [
                { name: 'channel', label: 'Channel ID', type: 'text', required: true, help: 'e.g. C12345678' },
                { name: 'text', label: 'Message Text', type: 'textarea', required: true }
            ],
            create_channel: [
                { name: 'name', label: 'Channel Name', type: 'text', required: true }
            ],
            schedule_message: [
                { name: 'channel', label: 'Channel ID', type: 'text', required: true },
                { name: 'message', label: 'Message Text', type: 'textarea', required: true },
                { name: 'post_at', label: 'Send At', type: 'datetime-local', required: true }
            ],
            invite_user: [
                { name: 'channel', label: 'Channel ID', type: 'text', required: true },
                { name: 'user', label: 'User ID', type: 'text', required: true, help: 'User ID like U123456' }
            ]
        }
    },

    google_sheets: {
        name: 'Google Sheets',
        description: 'Read and write spreadsheet data',
        icon: '',
        authType: 'oauth2',
        color: '#0F9D58',
        actions: ['read_rows', 'append_row', 'create_sheet', 'update_row', 'delete_row'],
        helpUrl: 'https://developers.google.com/sheets/api/guides/authorizing',
        setupInstructions: '1. Go to Google Cloud Console\n2. Create a project > Enable Sheets API\n3. Create OAuth 2.0 credentials\n4. Add authorized redirect URIs\n5. Copy Client ID and Secret',
        oauth: {
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        },
        actionSchemas: {
            read_rows: [
                { name: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', required: true },
                { name: 'range', label: 'Range', type: 'text', required: true, help: 'e.g. Sheet1!A1:B10' }
            ],
            append_row: [
                { name: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', required: true },
                { name: 'values', label: 'Row Values (JSON Array)', type: 'text', required: true, help: 'e.g. ["Column A", "Column B"]' }
            ],
            update_row: [
                { name: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', required: true },
                { name: 'sheetName', label: 'Sheet Name', type: 'text' },
                { name: 'rowNumber', label: 'Row Number', type: 'number', required: true },
                { name: 'values', label: 'Row Values (JSON Array)', type: 'text', required: true }
            ],
            delete_row: [
                { name: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', required: true },
                { name: 'sheetId', label: 'Sheet ID', type: 'text', help: 'Optional specific sheet ID' },
                { name: 'rowNumber', label: 'Row Number', type: 'number', required: true }
            ]
        }
    },

    notion: {
        name: 'Notion',
        description: 'Create and update pages and databases',
        icon: '',
        authType: 'oauth2',
        color: '#000000',
        actions: ['create_page', 'update_database'],
        helpUrl: 'https://developers.notion.com/docs/authorization',
        setupInstructions: '1. Go to https://www.notion.so/my-integrations\n2. Click "New integration"\n3. Give it a name and select workspace\n4. Copy the Internal Integration Token\n5. Share pages with your integration',
        oauth: {
            authUrl: 'https://api.notion.com/v1/oauth/authorize',
            tokenUrl: 'https://api.notion.com/v1/oauth/token',
            scopes: []
        },
        actionSchemas: {
            create_page: [
                { name: 'databaseId', label: 'Database ID', type: 'text', required: true },
                { name: 'properties', label: 'Properties (JSON)', type: 'textarea', required: true }
            ]
        }
    },

    stripe: {
        name: 'Stripe',
        description: 'Process payments and manage customers',
        icon: '',
        authType: 'api_key',
        color: '#635BFF',
        actions: ['create_customer', 'create_payment'],
        helpUrl: 'https://stripe.com/docs/keys',
        setupInstructions: `1. Log in to your Stripe Dashboard
2. Click "Developers" in the sidebar
3. Go to "API keys"
4. Copy your "Secret key" (starts with sk_)
 Never share your secret key publicly`,
        authFields: [
            { name: 'apiKey', label: 'Secret API Key', type: 'password', required: true, help: 'Found in Developers > API keys' }
        ],
        actionSchemas: {
            create_customer: [
                { name: 'email', label: 'Customer Email', type: 'email', required: true },
                { name: 'name', label: 'Customer Name', type: 'text' }
            ]
        }
    },

    email: {
        name: 'Email (SMTP/IMAP)',
        description: 'Send and receive emails',
        icon: '',
        authType: 'smtp',
        color: '#EA4335',
        actions: ['send_email', 'check_emails'],
        helpUrl: 'https://support.google.com/accounts/answer/185833',
        setupInstructions: 'For Gmail:\n1. Enable 2-Step Verification\n2. Go to Security > App passwords\n3. Create app password for "Mail"\n4. Use app password (not your Gmail password)\nSMTP: smtp.gmail.com:587\nIMAP: imap.gmail.com:993',
        authFields: [
            { name: 'host', label: 'SMTP Host', type: 'text', required: true, help: 'e.g. smtp.gmail.com' },
            { name: 'port', label: 'SMTP Port', type: 'number', required: true, help: 'e.g. 587' },
            { name: 'user', label: 'Username/Email', type: 'text', required: true },
            { name: 'pass', label: 'Password/App Password', type: 'password', required: true },
            { name: 'imapHost', label: 'IMAP Host', type: 'text', required: true, help: 'e.g. imap.gmail.com' },
            { name: 'imapPort', label: 'IMAP Port', type: 'number', required: true, help: 'e.g. 993' }
        ],
        actionSchemas: {
            send_email: [
                { name: 'to', label: 'To', type: 'text', required: true },
                { name: 'subject', label: 'Subject', type: 'text', required: true },
                { name: 'text', label: 'Body', type: 'textarea', required: true }
            ]
        }
    },

    kartra: {
        name: 'Kartra',
        description: 'Marketing automation and sales funnels',
        icon: 'K',
        authType: 'api_key',
        color: '#00BFA5',
        actions: ['create_lead', 'subscribe_to_list'],
        helpUrl: 'https://help.kartra.com/article/212-api-documentation',
        setupInstructions: '1. Log in to Kartra\n2. Go to My Account > Integrations\n3. Click on "API" tab\n4. Copy your API Key and API Password\n5. Keep these credentials secure',
        authFields: [
            { name: 'apiKey', label: 'API Key', type: 'password', required: true, help: 'Settings > API' },
            { name: 'apiPassword', label: 'API Password', type: 'password', required: true }
        ],
        actionSchemas: {
            create_lead: [
                { name: 'firstName', label: 'First Name', type: 'text', required: true },
                { name: 'email', label: 'Email', type: 'email', required: true }
            ],
            subscribe_to_list: [
                { name: 'email', label: 'Email', type: 'email', required: true },
                { name: 'listId', label: 'List ID', type: 'text', required: true }
            ]
        }
    },

    mailerlite: {
        name: 'MailerLite',
        description: 'Email marketing and newsletters',
        icon: 'M',
        authType: 'api_key',
        color: '#00A152',
        actions: ['create_subscriber', 'add_to_group', 'remove_from_group', 'update_subscriber'],
        helpUrl: 'https://developers.mailerlite.com/docs/authentication',
        setupInstructions: '1. Log in to MailerLite\n2. Go to Integrations > Developer API\n3. Generate a new API token\n4. Copy the token (starts with eyJ...)\n5. Paste it when connecting',
        authFields: [
            { name: 'apiKey', label: 'API Key', type: 'password', required: true, help: 'Integrations > API' }
        ],
        actionSchemas: {
            create_subscriber: [
                { name: 'email', label: 'Email', type: 'email', required: true },
                { name: 'name', label: 'Name', type: 'text' }
            ],
            add_to_group: [
                { name: 'email', label: 'Subscriber Email', type: 'email', required: true },
                { name: 'groupId', label: 'Group ID', type: 'text', required: true }
            ],
            remove_from_group: [
                { name: 'subscriberId', label: 'Subscriber ID', type: 'text', required: true },
                { name: 'groupId', label: 'Group ID', type: 'text', required: true }
            ],
            update_subscriber: [
                { name: 'subscriberId', label: 'Subscriber ID', type: 'text', required: true },
                { name: 'email', label: 'Email', type: 'email' },
                { name: 'fields', label: 'Custom Fields (JSON)', type: 'textarea', help: 'e.g. {"name":"Jane"}' }
            ]
        }
    },

    mailchimp: {
        name: 'Mailchimp',
        description: 'Marketing platform and email service',
        icon: 'M',
        authType: 'api_key',
        color: '#FFE01B',
        actions: ['add_member', 'send_campaign', 'create_campaign', 'add_tag'],
        helpUrl: 'https://mailchimp.com/help/about-api-keys/',
        setupInstructions: '1. Log in to Mailchimp\n2. Go to Account > Extras > API keys\n3. Click "Create A Key"\n4. Copy the API key\n5. Note server prefix from URL (e.g., us1)',
        authFields: [
            { name: 'apiKey', label: 'API Key', type: 'password', required: true, help: 'Account > Extras > API Keys' },
            { name: 'serverPrefix', label: 'Server Prefix', type: 'text', required: true, help: 'e.g. us1 (found in URL)' }
        ],
        actionSchemas: {
            add_member: [
                { name: 'listId', label: 'Audience ID', type: 'text', required: true },
                { name: 'email', label: 'Email Address', type: 'email', required: true },
                { name: 'status', label: 'Status', type: 'select', options: ['subscribed', 'pending'], required: true }
            ],
            send_campaign: [
                { name: 'campaignId', label: 'Campaign ID', type: 'text', required: true }
            ],
            create_campaign: [
                { name: 'listId', label: 'Audience ID', type: 'text', required: true },
                { name: 'subject', label: 'Subject Line', type: 'text', required: true },
                { name: 'fromName', label: 'From Name', type: 'text', required: true },
                { name: 'replyTo', label: 'Reply-To', type: 'email', required: true },
                { name: 'title', label: 'Internal Title', type: 'text' }
            ],
            add_tag: [
                { name: 'listId', label: 'Audience ID', type: 'text', required: true },
                { name: 'email', label: 'Subscriber Email', type: 'email', required: true },
                { name: 'tagName', label: 'Tag Name', type: 'text', required: true }
            ]
        }
    }
};

export function getIntegration(name) {
    return INTEGRATIONS[name] || null;
}

export function getAllIntegrations() {
    return Object.entries(INTEGRATIONS).map(([key, value]) => ({
        id: key,
        ...value,
    }));
}

export function isIntegrationSupported(name) {
    return name in INTEGRATIONS;
}
