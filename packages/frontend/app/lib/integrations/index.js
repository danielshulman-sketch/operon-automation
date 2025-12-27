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
        setupInstructions: '1. Go to https://api.slack.com/apps and click "Create New App" > "From scratch"\n2. Name the app, choose a workspace, and create it\n3. Open "OAuth & Permissions" and add scopes: chat:write, channels:manage, channels:read, users:read, team:read\n4. Add redirect URL: {APP_URL}/api/integrations/oauth/callback\n5. Click "Save URLs" and then "Install to Workspace"\n6. Copy the Client ID and Client Secret from "Basic Information"\n7. Paste them into Operon OAuth Settings and connect',
        oauth: {
            authUrl: 'https://slack.com/oauth/v2/authorize',
            tokenUrl: 'https://slack.com/api/oauth.v2/access',
            scopes: ['chat:write', 'channels:manage', 'channels:read', 'users:read', 'team:read']
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
        setupInstructions: '1. Go to Google Cloud Console (https://console.cloud.google.com/)\n2. Create or select a project, then enable the Google Sheets API\n3. Go to "APIs & Services" > "OAuth consent screen" and configure it\n4. Go to "Credentials" > "Create Credentials" > "OAuth client ID"\n5. Choose "Web application" and add redirect URI: {APP_URL}/api/integrations/oauth/callback\n6. Save and copy the Client ID and Client Secret\n7. Paste them into Operon OAuth Settings and connect',
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
        setupInstructions: '1. Go to https://www.notion.so/my-integrations and click "New integration"\n2. Choose "Public integration" and select the workspace\n3. Add redirect URL: {APP_URL}/api/integrations/oauth/callback\n4. Copy the OAuth Client ID and Client Secret\n5. Paste them into Operon OAuth Settings and connect\n6. Share the target pages/databases with the integration',
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

    airtable: {
        name: 'Airtable',
        description: 'Manage bases, tables, and records',
        icon: '',
        authType: 'oauth2',
        color: '#18BFFF',
        actions: ['read_records', 'create_record', 'update_record', 'delete_record'],
        helpUrl: 'https://airtable.com/developers/web/api/oauth-reference',
        setupInstructions: '1. Go to https://airtable.com/create/oauth and create an OAuth integration\n2. Add redirect URI: {APP_URL}/api/integrations/oauth/callback\n3. Add scopes: data.records:read, data.records:write\n4. Save and copy the Client ID and Client Secret\n5. Paste them into Operon OAuth Settings and connect',
        oauth: {
            authUrl: 'https://airtable.com/oauth2/v1/authorize',
            tokenUrl: 'https://airtable.com/oauth2/v1/token',
            scopes: ['data.records:read', 'data.records:write']
        },
        actionSchemas: {
            read_records: [
                { name: 'base_id', label: 'Base ID', type: 'text', required: true, help: 'Starts with app...' },
                { name: 'table_name', label: 'Table Name', type: 'text', required: true },
                { name: 'view', label: 'View Name', type: 'text', help: 'Optional view name' },
                { name: 'max_records', label: 'Max Records', type: 'number', help: 'Max 100' },
                { name: 'filter_formula', label: 'Filter Formula', type: 'text', help: 'Airtable formula' }
            ],
            create_record: [
                { name: 'base_id', label: 'Base ID', type: 'text', required: true },
                { name: 'table_name', label: 'Table Name', type: 'text', required: true },
                { name: 'fields', label: 'Fields (JSON)', type: 'textarea', required: true, help: '{"Name": "John", "Email": "john@example.com"}' }
            ],
            update_record: [
                { name: 'base_id', label: 'Base ID', type: 'text', required: true },
                { name: 'table_name', label: 'Table Name', type: 'text', required: true },
                { name: 'record_id', label: 'Record ID', type: 'text', required: true, help: 'Starts with rec...' },
                { name: 'fields', label: 'Fields (JSON)', type: 'textarea', required: true }
            ],
            delete_record: [
                { name: 'base_id', label: 'Base ID', type: 'text', required: true },
                { name: 'table_name', label: 'Table Name', type: 'text', required: true },
                { name: 'record_id', label: 'Record ID', type: 'text', required: true }
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
