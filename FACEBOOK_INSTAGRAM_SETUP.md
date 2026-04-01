# Facebook & Instagram Connection Setup

This guide walks you through connecting Facebook Pages and Instagram Business Accounts to your app.

## Quick Start (2 minutes)

1. Get your **Facebook App ID** and **App Secret** (see "Getting Credentials" below)
2. Set them in your `.env.local`:
```bash
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
```
3. Restart your development server
4. Go to **Connections** page and click **"Connect with Facebook"**
5. Approve permissions and select your page
6. Done! Your Facebook page and any linked Instagram Business Accounts are now connected

---

## Getting Credentials

### Step 1: Create a Facebook App

1. Go to **[Facebook Developers](https://developers.facebook.com/apps)**
2. Click **"My Apps"** → **"Create App"**
3. Choose **"Business"** as your app type
4. Fill in:
   - **App Name**: e.g., "My Social Feed App"
   - **App Contact Email**: Your email
   - **App Purpose**: Select "Manage Pages" or "Manage Business Accounts"
5. Click **"Create App"**

### Step 2: Set Up Products

1. In your app dashboard, find **"Products"** (left sidebar)
2. Add these products:
   - **Facebook Login** → Click "Set Up"
   - **Instagram Graph API** → Click "Set Up" (if you want Instagram support)

### Step 3: Configure OAuth Settings

1. Go to **Settings** → **Basic** (left sidebar)
   - Copy your **App ID** (you'll need this)
   - Copy your **App Secret** (you'll need this)

2. Go to **Settings** → **Basic** → scroll to **App Domains**
   - Add your domain:
     - **Development**: `localhost:3000`
     - **Production**: `yourdomain.com`

3. Go to **Facebook Login** → **Settings**
   - Under **Valid OAuth Redirect URIs**, add:
     - **Development**: `http://localhost:3000/api/auth/facebook/callback`
     - **Production**: `https://yourdomain.com/api/auth/facebook/callback`
   - Click **Save Changes**

### Step 4: Request Permissions

1. Go to **App Roles** → **Test Users** (or **Accounts** if using a Business Account)
2. Add your Facebook account as a tester or owner
3. Go to **Settings** → **Basic**
4. Request access to these permissions:
   - `pages_manage_posts` - Post to your pages
   - `pages_read_engagement` - Read page insights
   - `pages_manage_metadata` - Manage page settings
   - `instagram_business` - Access Instagram Business Accounts
   - `instagram_content_publish` - Post to Instagram

---

## Environment Variables

### Development (.env.local)
```bash
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
NEXTAUTH_URL=http://localhost:3000
```

### Production (.env or Vercel)
```bash
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
NEXTAUTH_URL=https://yourdomain.com
```

---

## How It Works

### Automatic Connection Flow
1. User clicks **"Connect with Facebook"** button
2. Browser redirects to Facebook login
3. User approves permissions
4. App fetches all user's Facebook Pages
5. App fetches any Instagram Business Accounts linked to those pages
6. **Everything is saved automatically** - no manual token entry needed

### What Gets Saved
- **Facebook Pages**: Page ID, name, and long-lived access token
- **Instagram Accounts**: Business Account ID and access token
- Tokens are automatically refreshed when needed

---

## Troubleshooting

### "Missing Facebook Config" Error
- Check that `FACEBOOK_APP_ID` is set in `.env.local`
- Restart your development server after adding the variable
- Verify the value doesn't have quotes around it

### "Invalid OAuth Redirect URI"
- Check that your redirect URI in Facebook App Settings matches exactly:
  - Should be: `http://localhost:3000/api/auth/facebook/callback` (dev)
  - Or: `https://yourdomain.com/api/auth/facebook/callback` (production)
- Make sure `NEXTAUTH_URL` environment variable matches your domain

### "Permission Denied" During Login
- Ensure you've requested the required permissions in your Facebook App Settings
- The app requests: `pages_manage_posts`, `pages_read_engagement`, `pages_manage_metadata`, `instagram_business`, `instagram_content_publish`
- You may need to submit your app for review if you haven't already

### No Instagram Account Appears After Connecting Facebook
- Instagram accounts only show if:
  1. Your Facebook Page is connected to an Instagram Business Account
  2. You have admin access to both the page and the Instagram account
  3. The Instagram account is properly linked in Facebook's business settings

### Token Expiration
- **Good news**: The app uses long-lived tokens (60 days)
- Tokens are automatically refreshed when posting
- You don't need to reconnect unless you revoke permissions in Facebook

---

## Next Steps

Once connected, you can:
- **Post to Facebook Pages** using the workflow system
- **Post to Instagram Business Accounts** automatically (if linked to your page)
- **Schedule posts** for specific times
- **Monitor engagement** via Facebook's insights

See the [Workflow Documentation](./WORKFLOWS.md) for posting examples.

---

## Manual Token Entry (Advanced/Fallback)

If the automatic flow doesn't work, you can manually add a token:

1. Go to [Facebook Graph Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Click "Generate Access Token"
4. Copy the token
5. In the Connections page, paste it into the "Or paste token" field
6. Select your page from the dropdown
7. Click "Add Connection"

**Note**: This creates a single connection. The automatic flow is recommended as it's more reliable.
