# Setup Documentation Index

Welcome! Here's a guide to all the setup documentation to get your app connected to Facebook, Instagram, and other social platforms.

## 🚀 Start Here (Choose Your Path)

### 👤 I'm a User (No Vercel Access)
**Time: 5 minutes**

1. Read [FACEBOOK_INSTAGRAM_USER_SETUP.md](./FACEBOOK_INSTAGRAM_USER_SETUP.md) - Step by step
2. Go to Settings in the app
3. Add your Facebook App credentials
4. Go to Connections and click "Connect with Facebook"
5. Done!

### 👨‍💼 I'm an Admin Setting Up for My Team
**Time: 25 minutes**

1. Read [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) (2 min) - Overview of what you need
2. Follow [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) (20 min) - Step-by-step instructions
3. Verify in [GETTING_STARTED.md](./GETTING_STARTED.md) (3 min) - Next steps

### 🏃 I just want to connect Facebook/Instagram now
**Time: 15 minutes**

1. Go to [FACEBOOK_INSTAGRAM_SETUP.md](./FACEBOOK_INSTAGRAM_SETUP.md) → Quick Start section
2. Get your credentials from Facebook Developers
3. Add to `.env.local` or Vercel
4. Restart your server
5. Click "Connect with Facebook" in the app

### 🔍 I need detailed instructions
**Time: 30 minutes**

Read [FACEBOOK_INSTAGRAM_SETUP.md](./FACEBOOK_INSTAGRAM_SETUP.md) - Complete comprehensive guide with screenshots and troubleshooting

### ❓ Something's not working
**Time: 5-10 minutes**

1. Check the error message in the app (red toast notification)
2. Find your error in [FACEBOOK_INSTAGRAM_SETUP.md#troubleshooting](./FACEBOOK_INSTAGRAM_SETUP.md#troubleshooting)
3. Try the suggested fix
4. If still stuck, check [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) for that phase

---

## 📚 Documentation Map

### Quick Answers
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - One-page cheat sheet
  - Essential links
  - Environment variables
  - Troubleshooting quick fixes
  - Common workflows

### Getting Started
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Complete onboarding guide
  - Installation steps
  - First social account connection
  - Creating your first workflow
  - Tips and tricks

### Setup Instructions
- **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** - Detailed step-by-step (Admin)
  - Phase 1-10 setup process
  - What to copy/paste where
  - Verification at each step
  - Quick troubleshooting

- **[FACEBOOK_INSTAGRAM_SETUP.md](./FACEBOOK_INSTAGRAM_SETUP.md)** - Facebook/Instagram deep dive (Admin)
  - How to get credentials
  - Configuration details
  - How it all works
  - Comprehensive troubleshooting

- **[FACEBOOK_INSTAGRAM_USER_SETUP.md](./FACEBOOK_INSTAGRAM_USER_SETUP.md)** - For Individual Users
  - No Vercel access needed
  - Add credentials in Settings
  - Perfect for non-admin users
  - 2-minute setup

### Overview & Planning
- **[SOCIAL_CONNECTIONS_SUMMARY.md](./SOCIAL_CONNECTIONS_SUMMARY.md)** - What's built, what's next
  - Feature checklist
  - Setup overview
  - Common issues
  - Implementation status

- **[FACEBOOK_SETUP_SUMMARY.md](./FACEBOOK_SETUP_SUMMARY.md)** - Three setup options explained
  - Option 1: Admin via environment variables
  - Option 2: User credentials in Settings
  - Option 3: Hybrid (recommended)
  - Comparison and recommendations

### Environment Configuration
- **[.env.example](./.env.example)** - Template with all variables
  - Copy this to `.env.local`
  - All available settings
  - Comments explaining each one

---

## 🎯 By Objective

### I want to...

#### Post to Facebook
→ [FACEBOOK_INSTAGRAM_SETUP.md](./FACEBOOK_INSTAGRAM_SETUP.md#quick-start) (5 min)
→ [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) phases 1-8 (20 min)

#### Post to Instagram
→ [FACEBOOK_INSTAGRAM_SETUP.md](./FACEBOOK_INSTAGRAM_SETUP.md#quick-start) (5 min)
→ [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) phases 1-9 (20 min)

#### Post to LinkedIn
→ [GETTING_STARTED.md#LinkedIn](./GETTING_STARTED.md) (3 min)
→ [QUICK_REFERENCE.md#Connection_Types](./QUICK_REFERENCE.md)

#### Schedule posts automatically
→ [GETTING_STARTED.md#Create_Workflow](./GETTING_STARTED.md) (5 min)
→ [QUICK_REFERENCE.md#Common_Workflows](./QUICK_REFERENCE.md)

#### Use Google Sheets as a content source
→ [GETTING_STARTED.md#Google_Sheets](./GETTING_STARTED.md) (5 min)
→ [QUICK_REFERENCE.md#Connection_Types](./QUICK_REFERENCE.md)

#### Enable AI content enhancement
→ [GETTING_STARTED.md#Add_AI](./GETTING_STARTED.md) (3 min)
→ [QUICK_REFERENCE.md#Pro_Tips](./QUICK_REFERENCE.md)

#### Fix "Connect with Facebook" not working
→ [FACEBOOK_INSTAGRAM_SETUP.md#Troubleshooting](./FACEBOOK_INSTAGRAM_SETUP.md#troubleshooting)
→ [SETUP_CHECKLIST.md#Troubleshooting](./SETUP_CHECKLIST.md#troubleshooting-during-setup)
→ [QUICK_REFERENCE.md#Troubleshooting](./QUICK_REFERENCE.md)

#### Set up everything from scratch
→ [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) (25 min)
→ [GETTING_STARTED.md](./GETTING_STARTED.md) (5 min)

---

## 📋 Checklist by File

### QUICK_REFERENCE.md
- [ ] Essential links saved
- [ ] Know where to find env variables
- [ ] Understand connection types
- [ ] Know first-time connection steps
- [ ] Have troubleshooting bookmarked

### SETUP_CHECKLIST.md
- [ ] Complete Phase 1: Preparation
- [ ] Complete Phase 2: Create Facebook App
- [ ] Complete Phase 3: Configure Settings
- [ ] Complete Phase 4-6: Add Products & Configure
- [ ] Complete Phase 7: Set Environment Variables
- [ ] Complete Phase 8: Test in App
- [ ] Complete Phase 9: Verify Instagram
- [ ] Complete Phase 10: Create First Workflow
- [ ] ✅ All green!

### GETTING_STARTED.md
- [ ] Environment set up
- [ ] Social account connected
- [ ] First workflow created
- [ ] (Optional) AI enabled
- [ ] (Optional) Google Sheets added

### FACEBOOK_INSTAGRAM_SETUP.md
- [ ] Read Quick Start
- [ ] Got Facebook App ID & Secret
- [ ] Set environment variables
- [ ] Restarted dev server
- [ ] Connected successfully
- [ ] Can post to Facebook
- [ ] Can post to Instagram (if linked)

---

## 🆘 Common Questions

**Q: Where do I get my Facebook App ID?**  
A: [FACEBOOK_INSTAGRAM_SETUP.md → Step 3](./FACEBOOK_INSTAGRAM_SETUP.md#step-3-configure-oauth-settings)

**Q: What's the difference between OAuth and manual token?**  
A: [FACEBOOK_INSTAGRAM_SETUP.md → How It Works](./FACEBOOK_INSTAGRAM_SETUP.md#how-it-works)

**Q: Why doesn't the Facebook button do anything?**  
A: [SETUP_CHECKLIST.md → Phase 8](./SETUP_CHECKLIST.md#phase-8-test-in-the-app-2-min)

**Q: How do I fix "Invalid OAuth Redirect URI"?**  
A: [FACEBOOK_INSTAGRAM_SETUP.md → Troubleshooting](./FACEBOOK_INSTAGRAM_SETUP.md#invalid-oauth-redirect-uri)

**Q: Can I post to multiple accounts?**  
A: [GETTING_STARTED.md → Tips](./GETTING_STARTED.md#tips)

**Q: How do tokens work?**  
A: [FACEBOOK_INSTAGRAM_SETUP.md → How It Works](./FACEBOOK_INSTAGRAM_SETUP.md#how-it-works)

**Q: What permissions does the app need?**  
A: [FACEBOOK_INSTAGRAM_SETUP.md → Phase 4](./FACEBOOK_INSTAGRAM_SETUP.md#step-4-request-permissions)

---

## ⏱️ Time Estimates

| Task | Document | Time |
|------|----------|------|
| Read overview | QUICK_REFERENCE.md | 5 min |
| Get Facebook credentials | FACEBOOK_INSTAGRAM_SETUP.md | 10 min |
| Set up environment | SETUP_CHECKLIST.md Phase 7 | 2 min |
| Test connection | SETUP_CHECKLIST.md Phase 8 | 2 min |
| Create first workflow | GETTING_STARTED.md | 5 min |
| **Total (Facebook only)** | All of above | **~25 min** |
| Add LinkedIn | QUICK_REFERENCE.md | 3 min |
| Add Google Sheets | GETTING_STARTED.md | 5 min |
| Enable AI | GETTING_STARTED.md | 3 min |
| **Total (Everything)** | All of above | **~40 min** |

---

## 🎯 Next Steps After Setup

Once you're connected to Facebook/Instagram:

1. **Create your first workflow** - [GETTING_STARTED.md](./GETTING_STARTED.md#3️-create-your-first-workflow)
2. **Explore AI features** - [GETTING_STARTED.md](./GETTING_STARTED.md#4️-add-ai-features-optional)
3. **Add Google Sheets** - [GETTING_STARTED.md](./GETTING_STARTED.md) (Google Sheets section)
4. **Build automation** - [QUICK_REFERENCE.md#Common_Workflows](./QUICK_REFERENCE.md)
5. **Optimize posting times** - Check Facebook/Instagram analytics

---

## 📞 Getting Help

1. **Error in the app?** → Check the red error message
2. **Specific issue?** → Search [FACEBOOK_INSTAGRAM_SETUP.md](./FACEBOOK_INSTAGRAM_SETUP.md#troubleshooting)
3. **General setup help?** → Read [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)
4. **Quick lookup?** → Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
5. **Still stuck?** → Create an issue on GitHub with:
   - What you're trying to do
   - The exact error message
   - Which document you followed

---

## ✅ Verification

You'll know everything is set up correctly when:

- ✅ "Connect with Facebook" button opens Facebook login
- ✅ You see your Facebook Page in Connections
- ✅ Instagram accounts auto-appear if linked
- ✅ You can create a workflow to post to Facebook
- ✅ Your test post appears on Facebook/Instagram

**If any of these fail**, check the corresponding troubleshooting section in [FACEBOOK_INSTAGRAM_SETUP.md](./FACEBOOK_INSTAGRAM_SETUP.md#troubleshooting)

---

## 🚀 You're Ready!

Pick your starting point above and let's get connected! 

Most people can be fully set up in **25 minutes**.

Good luck! 🎉
