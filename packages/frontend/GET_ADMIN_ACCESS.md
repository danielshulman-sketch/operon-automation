# Getting Admin Access

The "Skip to dashboard (demo)" link doesn't set up a proper authentication session, so you won't see admin features.

## Quick Fix - Use Browser Console

1. Open your browser at **http://localhost:3000**
2. Press **F12** to open Developer Tools
3. Go to the **Console** tab
4. Paste this code and press Enter:

```javascript
fetch('/api/superadmin/force', { method: 'POST' })
  .then(r => r.json())
  .then(data => {
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      alert('Admin token set! Refreshing...');
      window.location.reload();
    } else {
      console.log('Response:', data);
    }
  })
  .catch(err => console.error('Error:', err));
```

5. The page will refresh and you'll have full admin/superadmin access

## What This Does
- Calls the force endpoint to get a superadmin JWT token
- Stores it in localStorage
- Refreshes the page so it picks up your admin session
- You'll see all admin features including the superadmin dashboard

## Alternative: Reset Password
If you prefer to use email/password login, run:
```powershell
cd "c:\Users\danie\OneDrive\Documents\app  builds\New folder\packages\frontend"
node reset-password.js
```
This sets the password for daniel@easy-ai.co.uk to: `Admin123!`
