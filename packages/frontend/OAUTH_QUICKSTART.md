# Quick Start: Creating Your OAuth Apps

## 🚀 I'll guide you through each one!

Since OAuth apps require your personal account access, I can't create them automatically, but I can walk you through it step-by-step.

---

## 1. Slack OAuth App (START HERE - Already Open!)

You have the Slack apps page open. Here's what to do:

### Steps:
1. **Sign in** to Slack if not already signed in
2. Click the **"Create New App"** button (usually top-right)
3. Select **"From scratch"**
4. Fill in:
   - **App Name**: `Operon Email Platform`
   - **Workspace**: Select your workspace
5. Click **"Create App"**

### After creation:
6. Go to **"OAuth & Permissions"** (left sidebar)
7. Under **"Redirect URLs"**, click **"Add New Redirect URL"**
8. Paste: `https://frontend-eight-sigma-62.vercel.app/api/integrations/oauth/callback`
9. Click **"Add"** then **"Save URLs"**

### Add scopes:
10. Scroll to **"Bot Token Scopes"**
11. Click **"Add an OAuth Scope"** for each:
    - `chat:write`
    - `channels:manage`
    - `channels:read`
    - `users:read`
    - `team:read`

### Get credentials:
12. Go to **"Basic Information"** (left sidebar)
13. Scroll to **"App Credentials"**
14. Copy **Client ID** → save it
15. Show and copy **Client Secret** → save it

✅ **Slack done!**

---

## 2. Google Sheets OAuth App

### Open:
https://console.cloud.google.com

### Steps:
1. Click **"Select a project"** → **"New Project"**
2. Name: `Operon Platform`
3. Click **"Create"**
4. Search for **"Google Sheets API"** → **"Enable"**
5. Go to **"Credentials"** → **"Create Credentials"** → **"OAuth client ID"**
6. If prompted, configure consent screen:
   - User type: **External**
   - App name: `Operon Email Platform`
   - Your email for support
   - Click through the screens
7. Application type: **Web application**
8. Name: `Operon Web`
9. Authorized redirect URIs → Add:
   `https://frontend-eight-sigma-62.vercel.app/api/integrations/oauth/callback`
10. Click **"Create"**
11. Copy **Client ID** and **Client Secret**

✅ **Google Sheets done!**

---

## 3. Notion OAuth App

### Open:
https://www.notion.so/my-integrations

### Steps:
1. Click **"New integration"**
2. Choose **"Public integration"** ⚠️ (important!)
3. Name: `Operon Email Platform`
4. Select workspace
5. Click **"Submit"**
6. Find **"OAuth Domain & URIs"**
7. Add redirect URI:
   `https://frontend-eight-sigma-62.vercel.app/api/integrations/oauth/callback`
8. Copy **OAuth client ID**
9. Copy **OAuth client secret**

✅ **Notion done!**

---

## 4. Airtable OAuth App

### Open:
https://airtable.com/create/oauth

### Steps:
1. Click **"Register new OAuth integration"**
2. Name: `Operon Email Platform`
3. Redirect URL:
   `https://frontend-eight-sigma-62.vercel.app/api/integrations/oauth/callback`
4. Select scopes:
   - ✅ `data.records:read`
   - ✅ `data.records:write`
5. Click **"Register integration"**
6. Copy **Client ID**
7. Copy **Client Secret**

✅ **Airtable done!**

---

## 📝 Once You Have All Credentials

Run this command:
```powershell
cd "c:\Users\danie\OneDrive\Documents\app  builds\New folder\packages\frontend"
.\setup-oauth.ps1
```

Or add manually:
```powershell
vercel env add SLACK_CLIENT_ID production
vercel env add SLACK_CLIENT_SECRET production
vercel env add GOOGLE_SHEETS_CLIENT_ID production
vercel env add GOOGLE_SHEETS_CLIENT_SECRET production
vercel env add NOTION_CLIENT_ID production
vercel env add NOTION_CLIENT_SECRET production
vercel env add AIRTABLE_CLIENT_ID production
vercel env add AIRTABLE_CLIENT_SECRET production
```

Then deploy:
```powershell
vercel --prod
```

---

## 💡 Tips

- Keep all credentials in a text file temporarily
- Don't share credentials publicly
- The redirect URI must be EXACT for all apps
- Each app takes about 3-5 minutes to create

**Total time: ~15-20 minutes for all 4 apps**
