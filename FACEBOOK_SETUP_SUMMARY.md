# Facebook Setup - 3 Different Ways

Your app now supports **3 ways to set up Facebook** depending on your needs:

---

## Option 1️⃣ : Admin via Environment Variables (Vercel)

**Best for**: One shared Facebook App for all users

### Setup (5 minutes)
1. Get Facebook App ID & Secret from [developers.facebook.com](https://developers.facebook.com)
2. Go to Vercel Dashboard
3. Add environment variables:
   ```
   FACEBOOK_APP_ID=your_id
   FACEBOOK_APP_SECRET=your_secret
   NEXTAUTH_URL=https://yourdomain.com
   ```
4. Redeploy
5. All users share this app

### Pros
- ✅ Single app for entire team
- ✅ Easy to manage centrally
- ✅ One setup, everyone uses it

### Cons
- ❌ Requires Vercel access
- ❌ All users share the same credentials
- ❌ Harder to test with multiple Facebook apps

---

## Option 2️⃣ : Individual User Setup (Settings)

**Best for**: Each user has their own Facebook App or account

### Setup (2 minutes per user)
1. User creates their own Facebook App (free, 5 min)
2. User goes to **Settings** in your app
3. Pastes their App ID & Secret
4. Clicks "Save Facebook Credentials"
5. Goes to **Connections** and clicks "Connect with Facebook"
6. Done!

### Pros
- ✅ No Vercel access needed
- ✅ Each user can use their own app
- ✅ Super easy for end users
- ✅ More flexibility

### Cons
- ❌ Each user needs their own Facebook App
- ❌ Each user must set up their redirect URI

---

## Option 3️⃣ : Hybrid (Recommended)

**Best for**: Most teams

### Setup
1. **Admin**: Set up environment variables (Option 1) as fallback
2. **Users**: Can optionally override with their own credentials (Option 2)

### How it works
```
User clicks "Connect with Facebook"
    ↓
App checks: Does this user have their own credentials?
    ├→ YES: Use user's credentials
    └→ NO: Use environment variables (admin's)
```

### Pros
- ✅ Default shared app for most users
- ✅ Power users can add their own app
- ✅ Best of both worlds
- ✅ Requires minimal setup

---

## 📋 Quick Comparison

| Feature | Option 1 (Env Vars) | Option 2 (Settings) | Option 3 (Hybrid) |
|---------|------------------|-----------------|---------------|
| **Requires Vercel access** | ✅ Yes | ❌ No | ✅ Recommended |
| **Each user can use own app** | ❌ No | ✅ Yes | ✅ Yes |
| **Setup time** | 5 min (once) | 2 min (per user) | 5 min (once) |
| **User complexity** | Low | Very low | Low |
| **Flexibility** | Low | High | High |
| **Good for teams** | ✅ Yes | ❌ No | ✅ Yes |
| **Good for testing** | ❌ No | ✅ Yes | ✅ Yes |

---

## 🎯 Which Should You Use?

### Use Option 1 (Environment Variables) if:
- You have one Facebook App for the whole app
- All users should use the same credentials
- You don't want users managing their own apps
- You have Vercel access

### Use Option 2 (Settings) if:
- You want each user to manage their own Facebook App
- Users don't have Vercel access
- You want maximum flexibility
- No one is using it yet (just testing)

### Use Option 3 (Hybrid) if:
- You want both options available
- You have a default app but want power users to override
- You're building a tool for clients/teams
- You want the most flexibility

**Recommendation**: Start with **Option 3 (Hybrid)** - it's the most flexible!

---

## 🚀 Setup Instructions by Option

### Option 1: Admin via Vercel
→ See: [FACEBOOK_INSTAGRAM_SETUP.md](./FACEBOOK_INSTAGRAM_SETUP.md)

### Option 2: Individual User
→ See: [FACEBOOK_INSTAGRAM_USER_SETUP.md](./FACEBOOK_INSTAGRAM_USER_SETUP.md)

### Option 3: Hybrid (Recommended)
→ Do **both** of the above!

1. **Admin sets up** environment variables (Option 1 steps)
2. **Users can optionally** add their own (Option 2 steps)
3. Everything works automatically

---

## ✅ How to Know It's Working

Regardless of which option you choose:

- ✅ "Connect with Facebook" button opens Facebook login
- ✅ User can approve permissions
- ✅ Facebook Page appears in Connections
- ✅ Linked Instagram accounts auto-appear
- ✅ User can create workflows to post

---

## 🔑 Current Status

Your app is **fully set up for all 3 options**:

- ✅ Environment variables supported
- ✅ Per-user settings supported  
- ✅ Fallback logic implemented
- ✅ Settings UI in place
- ✅ Documentation ready

**Users can start connecting immediately** - they just need to know which option to use!

---

## 📞 Support

**User is trying to connect but doesn't have credentials?**
→ Send them: [FACEBOOK_INSTAGRAM_USER_SETUP.md](./FACEBOOK_INSTAGRAM_USER_SETUP.md)

**Admin trying to set up environment variables?**
→ Send them: [FACEBOOK_INSTAGRAM_SETUP.md](./FACEBOOK_INSTAGRAM_SETUP.md)

**General getting started?**
→ Send them: [GETTING_STARTED.md](./GETTING_STARTED.md)

---

## 🎓 Technical Details

### How Priority Works
When connecting to Facebook:

1. App checks if **user has saved credentials** in Settings
2. If yes → Use user's credentials
3. If no → Check environment variables
4. If no env vars → Redirect to Settings with error

### Environment Variables (Admin)
```bash
FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=xxx
NEXTAUTH_URL=https://yourdomain.com
```

### User Credentials (Settings)
- Stored in database per user
- Encrypted
- Separate from admin credentials
- User can add/remove anytime

### Database Fields
```
User.facebookAppId
User.facebookAppSecret
```

---

## Summary

| Step | Who | When | Documentation |
|------|-----|------|-----------------|
| Create Facebook App | Admin + Users | Once per app | Option 1 + 2 docs |
| Add env variables | Admin | Once | Option 1 doc |
| Add to Settings | Users (optional) | When needed | Option 2 doc |
| Connect in app | Users | Always | Guided in-app |

**Result**: Flexible system where admin can provide a default app, but users can bring their own if needed.

Perfect for SaaS, client tools, and multi-user apps! 🚀
