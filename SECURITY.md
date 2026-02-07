# Security Guidelines 🔒

## Critical: API Key Protection

### ⚠️ Your Anthropic API Key Must Stay Secret

**What is it?**
- Your Anthropic API key starts with `sk-ant-`
- It allows unlimited API calls charged to YOUR account
- If leaked, others can use it and YOU pay for it

**Where should it be?**
- ✅ In the `.env` file on your local machine ONLY
- ✅ In the backend server (`server.js`) environment variables
- ✅ In your production server's environment variables (Heroku, Railway, etc.)

**Where should it NEVER be?**
- ❌ In frontend React code
- ❌ In any file committed to git
- ❌ In screenshots or screen recordings
- ❌ In chat messages or emails
- ❌ In public documentation or tutorials

---

## How This App Protects Your Key

### 1. Backend Proxy Architecture

```
User Browser (React)
    ↓ (sends auth token, no API key)
Backend Server (server.js)
    ↓ (uses API key securely)
Anthropic API
```

The React frontend NEVER sees your API key. It only knows your backend server's URL.

### 2. Git Protection

The `.gitignore` file is configured to NEVER commit:
- `.env` files
- Any file containing sensitive keys

### 3. User Authentication

- Every API request requires a valid Firebase auth token
- Users can only use their own daily credits
- Credits are tracked per Google account
- No way to steal another user's credits

---

## Setup Security Checklist

Before running the app:

- [ ] Created `.env` file from `.env.example`
- [ ] Added your own Anthropic API key (not someone else's)
- [ ] Verified `.env` is in `.gitignore`
- [ ] **Never** shared your API key with anyone
- [ ] Understand that API usage is charged to YOUR account

---

## What Each User Needs

Every person running this app needs:
1. Their **own** Anthropic API key from https://console.anthropic.com/
2. Their **own** `.env` file with their key
3. To keep their key **private**

**Do NOT share API keys between users!** Each person should get their own key.

---

## Production Deployment Security

If deploying to production (Vercel, Netlify, Heroku, etc.):

### 1. Environment Variables
- Set `ANTHROPIC_API_KEY` in your hosting platform's environment variables
- NEVER hardcode it in your code

### 2. Backend Server
- Deploy `server.js` separately (e.g., Railway, Render, Heroku)
- Use HTTPS only
- Set proper CORS policies

### 3. Firebase Security Rules
- Keep Firebase Authentication rules up to date
- Only allow authenticated users

### 4. Rate Limiting
- The server already limits users to 50 AI calls/day
- Consider adding IP-based rate limiting for extra protection

---

## What to Do If Your Key Leaks

If you accidentally committed your `.env` file or shared your key:

1. **Immediately** go to https://console.anthropic.com/
2. **Delete** the compromised key
3. **Create** a new key
4. **Update** your `.env` file with the new key
5. **Review** your Anthropic usage logs for unauthorized activity

---

## Firebase Security

The Firebase configuration in `.env.example` is **safe to share** because:
- Firebase API keys are not secret (they identify your project)
- Security is enforced by Firebase Authentication rules
- Only authenticated users can access the app

**However:** Your Anthropic API key is **NEVER safe to share!**

---

## Questions?

**Q: Can I share my Firebase config?**  
A: Yes, Firebase configs are public by design. Security comes from auth rules.

**Q: Can I share my Anthropic API key?**  
A: **NO! NEVER!** This is a secret that charges YOUR account.

**Q: What if someone gets my backend URL?**  
A: That's okay - they still need a valid Firebase auth token to use it.

**Q: Can users see my API key in the browser?**  
A: No, it only exists on the backend server.

---

## Summary

✅ **DO:**
- Keep your Anthropic API key in `.env` (local) and environment variables (production)
- Use the backend proxy architecture
- Get your own API key for personal use
- Check `.gitignore` includes `.env`

❌ **DON'T:**
- Share your API key with anyone
- Commit `.env` to git
- Put API key in frontend code
- Use someone else's API key

---

**Remember:** If in doubt, DON'T SHARE IT! 🔒
