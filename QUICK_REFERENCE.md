# Quick Reference Card

## 🔗 Essential Links

| What | Where |
|------|-------|
| Setup Facebook/Instagram | [FACEBOOK_INSTAGRAM_SETUP.md](./FACEBOOK_INSTAGRAM_SETUP.md) |
| Step-by-step checklist | [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) |
| Get started guide | [GETTING_STARTED.md](./GETTING_STARTED.md) |
| Environment variables | [.env.example](./.env.example) |
| Facebook Developers | https://developers.facebook.com/apps |
| LinkedIn Developers | https://www.linkedin.com/developers/apps |
| Google Cloud Console | https://console.cloud.google.com/ |

---

## ⚙️ Environment Variables

### Minimal Setup (Just Facebook & Instagram)
```bash
# In .env.local:
FACEBOOK_APP_ID=xxxxx
FACEBOOK_APP_SECRET=xxxxx
NEXTAUTH_SECRET=something-random
NEXTAUTH_URL=http://localhost:3000
```

### Full Setup (All Integrations)
```bash
# Facebook
FACEBOOK_APP_ID=xxxxx
FACEBOOK_APP_SECRET=xxxxx

# LinkedIn  
LINKEDIN_CLIENT_ID=xxxxx
LINKEDIN_CLIENT_SECRET=xxxxx

# Google
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_SHEETS_CLIENT_ID=xxxxx
GOOGLE_SHEETS_CLIENT_SECRET=xxxxx

# Auth
NEXTAUTH_SECRET=xxxxx
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://...

# Optional
# OPENAI_API_KEY=sk-xxxxx (users add via Settings)
```

---

## 📱 Connection Types

| Platform | OAuth | Manual Token | Notes |
|----------|-------|--------------|-------|
| Facebook | ✅ Easy | ✅ Fallback | Auto-imports pages & Instagram |
| Instagram | ✅ Via Facebook | ✅ Via Facebook | Auto-detected from FB pages |
| LinkedIn | ✅ Recommended | ✅ Available | Need share permission |
| WordPress | ❌ No | ✅ Token | Self-hosted or .com |
| Google Sheets | ✅ OAuth | ❌ No | Source only, not destination |

---

## 🚀 First-Time Connection

### Facebook (5 minutes)
```
1. Go to Connections tab
2. Click "Connect New Account" → Facebook Page
3. Click "Connect with Facebook"
4. Approve → Select page → Done!
```

### LinkedIn (3 minutes)
```
1. Go to Connections tab
2. Click "Connect New Account" → LinkedIn
3. Click "Connect with LinkedIn"
4. Approve → Done!
```

### Google Sheets (2 minutes)
```
1. Create/find a Google Sheet
2. Get its ID from the URL (between /d/ and /edit)
3. Go to Connections → Google Sheets
4. Paste ID → Click Fetch
5. Select sheet → Done!
```

---

## 📝 Posting to Socials

### Facebook Page
```
Workflow:
  Input Node (Manual or Google Sheet)
    ↓
  Optional: AI Transform Node
    ↓
  Output Node → Select "Facebook Page"
    ↓
  Schedule Node (Now or Later)
    ↓
  Run!
```

### Instagram Business Account
```
Same as Facebook, but:
  Output Node → Select "Instagram account"
  (Must be linked to Facebook Page)
```

### LinkedIn
```
Same workflow structure
  Output Node → Select "LinkedIn Profile"
  (Note: LinkedIn prefers longer posts)
```

---

## 🔧 Troubleshooting

### "Connect with Facebook" doesn't work
```
1. Check FACEBOOK_APP_ID in .env.local
2. Restart server (pnpm dev)
3. Try again
```

### No pages appear after FB login
```
1. Log back in
2. In Facebook permissions, make sure you selected your pages
3. Try again
```

### Instagram doesn't appear
```
1. In Facebook: Settings → Accounts → check if IG is linked
2. Make sure it's a Business Account (not Creator)
3. Reconnect Facebook in app
```

### Token expired error
```
1. Tokens auto-refresh but may need reconnect
2. Go to Connections → Delete & reconnect the account
3. Try posting again
```

---

## 📊 Workflow Nodes

| Node Type | Input/Output | Purpose |
|-----------|--------------|---------|
| Input | Input | Where content comes from (manual, Google Sheet, RSS) |
| AI Transform | Both | Rewrite/enhance content with AI |
| Delay | Both | Wait X minutes before next node |
| Schedule | Both | Set specific time to publish |
| Output | Output | Post to Facebook/LinkedIn/etc |
| Filter | Both | Conditionally run next node |

---

## 🎯 Common Workflows

### Daily Auto-Post from Google Sheet
```
Input: Google Sheets
  ↓ (Daily schedule)
AI Transform (optional rewrite)
  ↓ (Every 24 hours)
Output: Facebook Page + Instagram
  ↓
Schedule: 9am daily
```

### Manual Post with AI Enhancement
```
Input: Manual (paste text)
  ↓
AI Transform: "Make engaging"
  ↓
Output: Facebook Page
  ↓
Schedule: Publish now
```

### LinkedIn Post from RSS Feed
```
Input: RSS Feed
  ↓
AI Transform: "Shorten for LinkedIn"
  ↓
Output: LinkedIn
  ↓
Schedule: Every 6 hours
```

---

## 🔐 Keeping Tokens Secure

✅ **Do**:
- Store tokens in `.env.local` (not in git)
- Use long-lived tokens (60 days)
- Let the app auto-refresh tokens
- Revoke access from your account settings if compromised

❌ **Don't**:
- Paste tokens in chat/slack
- Commit `.env.local` to git
- Share your app secret
- Use short-lived tokens manually

---

## 📞 Support Checklist

When you need help:

- [ ] Check the error message (usually tells you what's wrong)
- [ ] See [FACEBOOK_INSTAGRAM_SETUP.md](./FACEBOOK_INSTAGRAM_SETUP.md#troubleshooting)
- [ ] Review [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)
- [ ] Check `.env.local` has all required variables
- [ ] Restart your dev server
- [ ] Clear browser cache (Ctrl+Shift+Del)
- [ ] Try reconnecting the account

---

## 💡 Pro Tips

1. **Test on a test page first** - Don't post to your main page while testing
2. **Save drafts** - Workflows can be saved without running
3. **Schedule during business hours** - Best time varies by audience
4. **Use AI to vary captions** - AI transform makes posts unique each time
5. **Monitor analytics** - Check Facebook/Instagram insights for best times
6. **Start simple** - Get one manual post working before automating
7. **Google Sheets is your friend** - Perfect for bulk scheduling content

---

## 🎓 Full Documentation

For complete details, see:
- **Detailed Setup**: [FACEBOOK_INSTAGRAM_SETUP.md](./FACEBOOK_INSTAGRAM_SETUP.md)
- **Step-by-Step**: [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)
- **General Getting Started**: [GETTING_STARTED.md](./GETTING_STARTED.md)
- **Summary**: [SOCIAL_CONNECTIONS_SUMMARY.md](./SOCIAL_CONNECTIONS_SUMMARY.md)

---

**Last Updated**: 2024
**App Version**: Latest
**Status**: ✅ Ready to use
