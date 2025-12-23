# OAuth Setup for Integrations

To enable OAuth integrations (Slack, Google Sheets, Notion), you need to configure OAuth credentials in your environment variables.

## Required Environment Variables

Add these to your `.env.local` file:

### Slack OAuth
```bash
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
```

**How to get Slack credentials**:
1. Go to https://api.slack.com/apps
2. Click "Create New App" > "From scratch"
3. Name your app and select workspace
4. Go to "OAuth & Permissions"
5. Add Redirect URL: `http://localhost:3000/api/integrations/oauth/callback`
6. Add these scopes under "Bot Token Scopes":
   - `chat:write`
   - `channels:manage`
   - `team:read`
   - `users:read`
   - `conversations:list`
7. Find your credentials in "Basic Information":
   - Client ID
   - Client Secret

### Google Sheets OAuth
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**How to get Google credentials**:
1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable "Google Sheets API"
4. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Add Authorized redirect URI: `http://localhost:3000/api/integrations/oauth/callback`
7. Copy Client ID and Client Secret

### Notion OAuth
```bash
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
```

**How to get Notion credentials**:
1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Fill in basic information
4. Under "OAuth Domain & URIs"
5. Add Redirect URI: `http://localhost:3000/api/integrations/oauth/callback`
6. Copy OAuth client ID and OAuth client secret

## App URL Configuration

Also add your app's public URL:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, change this to your actual domain:
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## After Adding Credentials

1. Restart your development server
2. Go to Automations > Integrations
3. OAuth integrations (Slack, Google Sheets, Notion) will now show "Connect" button
4. Click "Connect" to start OAuth flow

## Troubleshooting

**"Missing OAuth Config" button**:
- Environment variables not set
- Restart dev server after adding variables

**OAuth fails with redirect error**:
- Check redirect URIs match exactly in OAuth provider settings
- Should be: `{YOUR_APP_URL}/api/integrations/oauth/callback`

**"Configuration missing" error**:
- Check environment variable names match exactly
- Variables should be in `.env.local` file
- Must restart server after changes
