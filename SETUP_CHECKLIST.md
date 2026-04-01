# 🚀 Facebook & Instagram Setup Checklist

## Phase 1: Preparation (5 min)

- [ ] Have your Facebook account ready (admin or owner of a page)
- [ ] Have your Instagram Business Account (must be connected to a Facebook Page)
- [ ] Have admin access to your project's `.env.local` file
- [ ] Open [Facebook Developers](https://developers.facebook.com/apps) in another tab

## Phase 2: Create Facebook App (5 min)

- [ ] Go to [Facebook Developers](https://developers.facebook.com/apps)
- [ ] Click "My Apps" → "Create App"
- [ ] Select "Business" type
- [ ] Fill in:
  - [ ] App Name (e.g., "My Social Feed App")
  - [ ] Email address
  - [ ] Purpose (select relevant category)
- [ ] Click "Create App"

## Phase 3: Configure App Settings (3 min)

- [ ] Go to "Settings" → "Basic"
- [ ] **Copy your App ID**: `____________________________`
- [ ] **Copy your App Secret**: `____________________________`
- [ ] Scroll to "App Domains"
- [ ] Add Domain: `localhost:3000` (for development)

## Phase 4: Add Facebook Login Product (2 min)

- [ ] Go to "Products" (left sidebar)
- [ ] Search for "Facebook Login"
- [ ] Click "Set Up"
- [ ] Choose "Web" as your platform
- [ ] Click "Continue"

## Phase 5: Configure OAuth Redirects (2 min)

- [ ] In Facebook Login Settings, find "Valid OAuth Redirect URIs"
- [ ] Add these URIs:
  ```
  http://localhost:3000/api/auth/facebook/callback
  ```
- [ ] For production, add:
  ```
  https://yourdomain.com/api/auth/facebook/callback
  ```
- [ ] Click "Save Changes"

## Phase 6: Request Permissions (1 min)

- [ ] Go to "Settings" → "Basic"
- [ ] You'll see "User Roles" section
- [ ] Make sure your own Facebook account is added as an admin/tester
- [ ] The app will request these permissions:
  - `public_profile`
  - `pages_show_list`
  - `pages_read_engagement`
  - `pages_manage_posts`
  - `pages_manage_metadata`
  - `instagram_basic`
  - `instagram_content_publish`

## Phase 7: Set Environment Variables (2 min)

- [ ] Open your `.env.local` file
- [ ] Add these lines:
  ```bash
  FACEBOOK_APP_ID=INSERT_YOUR_APP_ID_HERE
  FACEBOOK_APP_SECRET=INSERT_YOUR_APP_SECRET_HERE
  ```
- [ ] Replace with the values you copied in Phase 3
- [ ] Save the file
- [ ] **Important**: Restart your development server

## Phase 8: Test in the App (2 min)

- [ ] Open your app at `http://localhost:3000`
- [ ] Navigate to **Connections** tab
- [ ] Click **"Connect New Account"**
- [ ] Select **"Facebook Page"**
- [ ] Click **"Connect with Facebook"** (the blue button)
- [ ] You should be redirected to Facebook login
- [ ] Log in with your Facebook account
- [ ] Approve the permissions
- [ ] Select your Facebook Page(s)
- [ ] ✅ You're connected!

## Phase 9: Verify Instagram (1 min)

- [ ] Look in the Connections tab
- [ ] You should see:
  - Your Facebook Page(s)
  - Any linked Instagram Business Accounts
- [ ] If Instagram doesn't appear:
  - Make sure you're using a Business Account Instagram
  - Make sure it's connected to the Facebook Page in Facebook's settings
  - Try reconnecting

## Phase 10: Create Your First Workflow (5 min)

- [ ] Go to **Workflows** tab
- [ ] Click **"Create Workflow"** or **"Add Node"**
- [ ] Configure:
  - Input: "Manual Input" or select a Google Sheet
  - Content: Type your post text
  - Output: Select your Facebook Page or Instagram account
  - Schedule: "Publish Now" or set a time
- [ ] Click **"Run"**
- [ ] ✅ Your first post is on its way!

---

## 📋 Troubleshooting During Setup

| Step | Error | Solution |
|------|-------|----------|
| Phase 8 | Button does nothing | Check `FACEBOOK_APP_ID` in `.env.local`, restart server |
| Phase 8 | "Invalid OAuth Redirect" | Make sure redirect URI in Facebook App Settings matches exactly |
| Phase 9 | No Instagram shown | Verify Instagram is Business Account and linked in Facebook settings |
| Phase 10 | Post fails | Check that you're posting to a Page (not personal profile) |

---

## ✅ Success Indicators

When everything is working:

- ✅ "Connect with Facebook" button opens Facebook login
- ✅ You see your Facebook Page(s) in Connections
- ✅ Any linked Instagram accounts appear automatically
- ✅ You can create workflows with your page as output
- ✅ Posts publish successfully to Facebook/Instagram

---

## 🎉 You're All Set!

**Total time: ~25 minutes** 

Your app can now:
- Post to multiple Facebook Pages
- Post to linked Instagram Business Accounts
- Schedule posts for specific times
- Use AI to enhance captions (if OpenAI key is added)
- Pull content from Google Sheets
- Automate your social media presence

---

## Next Steps (Optional)

1. **Add More Accounts**: Repeat Phase 8 for other pages
2. **Enable AI** : Add OpenAI key in Settings → API Keys
3. **Add Google Sheets**: Connect a Google Sheet as a content source
4. **Create Workflows**: Build automation rules for your content
5. **Schedule Posts**: Set optimal times for publishing

---

## Support

If you get stuck:

1. **Check the error message** - It usually tells you what's wrong
2. **See [FACEBOOK_INSTAGRAM_SETUP.md](./FACEBOOK_INSTAGRAM_SETUP.md)** - Detailed guide
3. **See [.env.example](./.env.example)** - All environment variables
4. **Check "Valid OAuth Redirect URIs"** in Facebook App Settings

Good luck! 🚀
