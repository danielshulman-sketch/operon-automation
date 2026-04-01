# Facebook & Instagram Setup for Individual Users

This guide is for users who want to connect their own Facebook Pages and Instagram Business Accounts **without needing admin access to environment variables**.

## ✨ The Easy Way (2 minutes)

Each user can add their own Facebook App credentials directly in the app!

### Step 1: Get Your Facebook App Credentials

1. Go to **[Facebook Developers](https://developers.facebook.com/apps)**
2. Log in with your Facebook account
3. Click **"My Apps"** → **"Create App"**
4. Choose **"Business"** type
5. Fill in basic info and click **"Create App"**
6. Go to **Settings → Basic**
7. **Copy your App ID** and **App Secret** (click Show)

### Step 2: Save in Your Profile

1. In the app, go to **Settings** (top right menu)
2. Scroll down to **"Facebook Developer App"** section
3. Paste your:
   - **App ID** 
   - **App Secret**
4. Click **"Save Facebook Credentials"**
5. You should see a green "Connected" badge

### Step 3: Set Up OAuth Redirect in Facebook

Back in your Facebook app:

1. Go to **Products** (left sidebar)
2. Add **"Facebook Login"** product
3. Go to **Facebook Login → Settings**
4. Find **"Valid OAuth Redirect URIs"**
5. Add the redirect URI shown in your Settings page:
   ```
   https://yourdomain.com/api/auth/facebook/callback
   ```
6. Click **"Save Changes"**

### Step 4: Connect in Connections Tab

1. In the app, go to **Connections** tab
2. Click **"Connect New Account"** → **"Facebook Page"**
3. Click **"Connect with Facebook"** (blue button)
4. You'll be redirected to Facebook login
5. Approve permissions
6. Select your Facebook Page(s)
7. ✅ Done!

---

## 🤔 FAQ

### Do I need admin access to Vercel?
**No!** You can set up everything from within the app itself. Just use the Settings page.

### Can multiple users have different Facebook apps?
**Yes!** Each user can add their own App ID and Secret in their Settings. They all work independently.

### What if I don't have a Facebook App yet?
You need to create one at [Facebook Developers](https://developers.facebook.com/apps). It's free and takes 5 minutes.

### Do I need to know how to code?
**No!** It's all UI-based. Just copy/paste your credentials.

### Where do I find my App Secret?
In your Facebook App → **Settings → Basic** → Look for "App Secret" field → Click **"Show"**

### What's the redirect URI for?
It tells Facebook where to send users after they approve. The app shows you the exact value to add.

### Can I use someone else's Facebook App?
Yes, but:
- You need their App ID and Secret
- Your admin must add your domain to their app's redirect URIs
- It's better to create your own app (it's free)

---

## ⚠️ Troubleshooting

### Error: "Facebook App ID/Secret missing"
→ Go to **Settings** and add your credentials

### Error: "Invalid OAuth Redirect URI"
→ Check that you added the correct redirect URI in your Facebook App settings (exact match required)

### Button does nothing
→ Make sure you clicked "Save Facebook Credentials" in Settings (look for green "Connected" badge)

### "No pages found"
→ Make sure you:
1. Selected your page in the Facebook permissions popup
2. Have at least one Facebook Page that you're admin of

### Instagram doesn't appear
→ Your Facebook Page must be connected to an Instagram Business Account in Facebook's admin settings

---

## 🎯 Complete Workflow

```
Settings (Add your App credentials)
    ↓
Connections (Click "Connect with Facebook")
    ↓
Facebook login popup (Approve permissions)
    ↓
Select your page
    ↓
✅ Your page appears in Connections
✅ Any linked Instagram accounts auto-appear
```

---

## 🔒 Security Notes

- ✅ Your credentials are encrypted in the database
- ✅ Only you can access your credentials
- ✅ The app never shares credentials between users
- ✅ You can remove credentials anytime from Settings

---

## Next Steps

Once connected:
1. Go to **Workflows** tab
2. Create a new workflow with your page as output
3. Post your first content!

See **[GETTING_STARTED.md](./GETTING_STARTED.md)** for workflow setup.

---

## Summary

**Before**: Need admin to set environment variables in Vercel
**After**: Add credentials in Settings, click Connect!

**Time**: ~5 minutes
**Cost**: Free (Facebook Developer app is free)
**Difficulty**: Very easy - just copy/paste
