# Getting Started with Social Feeds App

## 1️⃣ First-Time Setup (15 minutes)

### Step 1: Clone & Install
```bash
git clone <your-repo>
cd "New folder"
pnpm install
```

### Step 2: Environment Variables
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your values
# Minimum required for testing:
#   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
#   - NEXTAUTH_URL (http://localhost:3000 for dev)
```

### Step 3: Database
```bash
# Make sure your database URL is set in .env.local
# If using Vercel PostgreSQL or similar, it should already be pulled
```

### Step 4: Start Development
```bash
pnpm dev
# Open http://localhost:3000
```

---

## 2️⃣ Connect Your First Social Account

### Facebook & Instagram (Easiest)
1. **[Follow the Facebook Setup Guide](./FACEBOOK_INSTAGRAM_SETUP.md)** (5 minutes)
2. Get your Facebook App ID & Secret
3. Add to `.env.local`:
   ```bash
   FACEBOOK_APP_ID=your_id_here
   FACEBOOK_APP_SECRET=your_secret_here
   ```
4. Restart your dev server
5. Go to **Connections** tab and click **"Connect with Facebook"**
6. Approve permissions and select your page

### LinkedIn (Optional)
1. Create app at [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Add Client ID & Secret to `.env.local`
3. Request access to "Share on LinkedIn"
4. Go to Connections and click "Connect with LinkedIn"

### Google Sheets (Optional)
For using Google Sheets as a content source:
1. Create credentials at [Google Cloud Console](https://console.cloud.google.com/)
2. Add to `.env.local`
3. Create a Google Sheet and share it
4. Paste the sheet ID in Connections

---

## 3️⃣ Create Your First Workflow

Once you have a social account connected:

1. Go to **Workflows** tab
2. Click **"Create Workflow"** or **"Add Node"**
3. Configure:
   - **Input Node** - Choose your content source (manual text, Google Sheet, RSS feed)
   - **Process Node** - Optional: AI enhancement (if you have OpenAI key set)
   - **Output Node** - Select your connected Facebook/Instagram page
   - **Schedule** - Set to publish immediately or schedule for later
4. Click **"Run Workflow"** to test

---

## 4️⃣ Add AI Features (Optional)

To enable AI-powered content enhancement:

1. Get your OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys)
2. Go to **Settings** → **API Keys**
3. Paste your OpenAI key
4. Now you can use **AI Transform** nodes in workflows

---

## 📋 Quick Reference

### Pages
- **Dashboard** - Overview and quick stats
- **Connections** - Add/manage social accounts, Google Sheets, AI providers
- **Workflows** - Create automation rules
- **Settings** - User profile, API keys, credentials

### Common Tasks
| Task | Steps |
|------|-------|
| Post to Facebook | Connections → Connect with Facebook → Create Workflow → Output Node |
| Post to Instagram | Connections → Connect with Facebook (auto-detects IG) → Output Node |
| Schedule posts | Workflow → Add Schedule node → Set time |
| Use AI to improve posts | Settings → Add OpenAI key → Workflow → Add AI node |
| Pull content from Google Sheet | Connections → Add Google Sheet → Workflow → Input from Sheet |

---

## 🆘 Troubleshooting

### "Connect with Facebook" button does nothing
- Check that `FACEBOOK_APP_ID` is set in `.env.local`
- Restart dev server: `pnpm dev`
- See [Facebook Setup Guide](./FACEBOOK_INSTAGRAM_SETUP.md) for detailed steps

### "No pages found" after Facebook login
- Make sure you selected your pages in the permissions popup
- Check that your Facebook App is configured in the [Facebook Developer Portal](https://developers.facebook.com/)

### AI nodes not showing up
- You need to add an OpenAI API key in **Settings** → **API Keys**
- Then workflows will have AI node options

### Post failed to publish
- Check that your token is still valid (may need to reconnect)
- For Facebook: Ensure you're posting to a **Page**, not a personal profile
- See error message in toast notification for details

---

## 📚 Full Documentation

- [Facebook & Instagram Setup](./FACEBOOK_INSTAGRAM_SETUP.md) - Complete guide for connecting FB/IG
- [Environment Variables](/.env.example) - All configurable settings
- [OAUTH_SETUP.md](./OAUTH_SETUP.md) - OAuth configuration details

---

## 💡 Tips

- **Test Mode**: Create a test Facebook Page first to avoid posting to your main page
- **Scheduling**: Use the Schedule node to publish at optimal times
- **Multiple Accounts**: Each person can connect their own Facebook/Instagram in Connections
- **Google Sheets**: Perfect for bulk content scheduling - just paste URLs and captions
- **AI Enhancement**: Let AI rewrite posts to be more engaging before publishing

---

Need help? Check the guides or create an issue on GitHub.
