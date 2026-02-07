# ⚠️ IMPORTANT: READ THIS FIRST! ⚠️

## 🔒 API Key Security

Your Anthropic API key is **SECRET** and must **NEVER** be exposed!

### ✅ CORRECT Setup:

1. **Backend Only**: API key goes in `.env.backend`
2. **Frontend Safe**: Firebase config goes in `.env`
3. **Never Commit**: `.env.backend` stays local only

```
CalorieTrack/
├── .env.backend          ← Create this, add YOUR API key (SECRET!)
├── .env                  ← Create this from .env.example (PUBLIC, safe)
├── server.js             ← Backend (uses .env.backend)
└── src/                  ← Frontend (no API key here!)
```

### ❌ NEVER Do This:

- ❌ Put API key in `.env` (that's for frontend)
- ❌ Put API key in React code (`src/` folder)
- ❌ Commit `.env.backend` to git
- ❌ Share your API key with anyone

---

## 🚀 Quick Setup (2 Steps)

### Step 1: Create `.env.backend`
```bash
# In root folder, create .env.backend:
ANTHROPIC_API_KEY=sk-ant-your-actual-key-from-anthropic-console
```

Get your key: https://console.anthropic.com/ → API Keys

### Step 2: Create `.env`
```bash
# Copy the example file:
cp .env.example .env
# (This has Firebase config - it's public and safe)
```

---

## 🏃 Run It

```bash
npm install

# Terminal 1 - Backend (has your secret key)
npm run proxy

# Terminal 2 - Frontend (no secrets here)
npm start
```

---

## 📚 Full Documentation

- **QUICK_START.md** - Complete setup guide
- **SECURITY.md** - Detailed security explanation
- **FIREBASE_SETUP.md** - Firebase configuration
- **README.md** - Project overview

---

## ✅ Security Checklist

Before you start:
- [ ] Understand: API key ONLY goes in `.env.backend`
- [ ] Created `.env.backend` with your API key
- [ ] Created `.env` from `.env.example`
- [ ] Verified `.env.backend` is in `.gitignore` ✓
- [ ] Will NEVER commit `.env.backend` to git ✓

---

## 🆘 Need Help?

**"API key not configured"**
→ Create `.env.backend` with your Anthropic API key

**"Firebase error"**
→ Create `.env` from `.env.example`

**Still stuck?**
→ Read `QUICK_START.md` for step-by-step instructions

---

**Remember: Backend = Secret | Frontend = Public**

🔒 Keep your API key safe!
