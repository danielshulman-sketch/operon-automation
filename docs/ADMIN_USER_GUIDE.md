# Admin User Guide

This guide explains how admins set up the system, manage users, configure AI, connect integrations, and monitor activity.

## 1) Getting Started
- Log in with an admin account.
- Open Settings from the left sidebar.

## 2) Organization and Users
### View users
- Go to Settings.
- Open the Team tab (admin and superadmin only).
- Review all users in your organization.

### Reset a user password
- In the Team tab, select a user.
- Click "Reset Password".
- Share the generated temporary password with the user.

## 3) Email Setup
### Connect email
- Go to Email Stream.
- Click "Connect Email".
- Choose OAuth (Gmail) or SMTP/IMAP.
- For SMTP/IMAP, enter host, port, and credentials.

### Auto sync
- Go to Settings -> Automations.
- Enable "Auto Sync Emails".
- Choose an interval (minutes).

## 4) AI Settings
### Configure AI provider and models
- Go to AI Settings.
- Choose provider (OpenAI, Anthropic, Google).
- Enter model name (optional).
- Add API keys for the providers you want to use.
- Save.

### Voice training button
- Users can train their voice in Settings.
- Admins should ensure AI keys are set before training.

## 5) Integrations
### OAuth integrations (Slack, Google Sheets, Notion)
- Set local env vars (or hosting env) for each provider:
  - SLACK_CLIENT_ID, SLACK_CLIENT_SECRET
  - GOOGLE_SHEETS_CLIENT_ID, GOOGLE_SHEETS_CLIENT_SECRET
  - NOTION_CLIENT_ID, NOTION_CLIENT_SECRET
- Ensure NEXT_PUBLIC_APP_URL is set.
- Add the redirect URI on each provider:
  - `${NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback`
- Go to Automations -> Manage Integrations and connect.

### API key integrations (MailerLite, Mailchimp, Kartra)
- Go to Automations -> Manage Integrations.
- Click Connect and enter the API keys for the provider.

## 6) Automations
### Create automation
- Go to Automations -> Create Automation.
- Pick a trigger (scheduled, webhook, email received).
- Add steps using connected integrations.
- Save and enable.

### Run automation manually
- Open an automation.
- Click "Run" to execute immediately.

## 7) Stats
### Integration stats
- Open Integrations Stats from the left sidebar.
- Click a connected app to view details.
- Some integrations only show summary data.

## 8) Troubleshooting
- "Missing OAuth config": set provider client id/secret and restart server.
- "Failed to connect": check API key format and network access.
- "Internal Server Error": review server logs for the exact error.

