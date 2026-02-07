# Quick Start Guide 🚀

Firebase is already configured! You only need your own Anthropic API key.

## ⚠️ IMPORTANT: API Key Security

**NEVER share your Anthropic API key with anyone!**
- Keep it only in the `.env` file on your local machine
- The `.env` file should NEVER be committed to git
- Each user must get their own API key

## Step 1: Get Your Own Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or create an account
3. Click "API Keys" in the left sidebar
4. Click "Create Key"
5. **Copy your key** (starts with `sk-ant-`)
6. **Keep it secret!** Don't share it with anyone

## Step 2: Create Your .env File

1. **Copy** the `.env.example` file
2. **Rename** the copy to `.env`
3. **Open** the `.env` file
4. **Replace** this line:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-own-key-here-get-from-anthropic-console
   ```
   
   With your actual key:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-YOUR-ACTUAL-KEY-HERE
   ```

5. **Save** the file

⚠️ **NEVER commit the .env file to git!** It's already in .gitignore to protect you.

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Start the App

Open **TWO** terminal windows:

### Terminal 1 - Backend Server
```bash
npm run proxy
```

Wait until you see:
```
🔥 CalorieTrack API Proxy running on http://localhost:3001
📊 Daily limit: 50 AI calls per user
```

### Terminal 2 - React App
```bash
npm start
```

Browser will open automatically at `http://localhost:3000`

## Step 5: Sign In & Test

1. Click **"Continue with Google"**
2. Sign in with your Google account
3. Set your daily calorie goal (e.g., 2000)
4. Test the AI:
   - Type "pizza" and click 🤖 AI
   - Upload a food photo
   - Watch your credits: 🤖 50/50 → 🤖 49/50

---

## That's It! 🎉

### What You Get

- ✅ **50 AI calls per day** (per user)
- ✅ **Google sign-in** (no passwords!)
- ✅ **Bilingual** (English ↔ Arabic)
- ✅ **Photo scanning** with AI
- ✅ **Auto calorie estimation**
- ✅ **Secure API key** (backend only)

### Troubleshooting

**"Firebase: Error (auth/configuration-not-found)"**
- Make sure you created the `.env` file from `.env.example`
- Check that Firebase variables are present
- Restart both terminal windows

**"API key not configured"**
- Make sure you created `.env` file (copy from `.env.example`)
- Check your `ANTHROPIC_API_KEY` is correct in `.env`
- Make sure Terminal 1 (proxy server) is running

**"Daily AI credit limit reached"**
- You used all 50 credits today
- Credits reset at midnight
- OR change `DAILY_CREDIT_LIMIT` in `server.js`

---

## Security Checklist ✅

- [ ] Created `.env` file from `.env.example`
- [ ] Added your own Anthropic API key
- [ ] **Never** shared your API key with anyone
- [ ] **Never** committed `.env` file to git
- [ ] Backend server is running (Terminal 1)

---

## Files You Can Edit

### Change Daily Credit Limit
File: `server.js` (line 15)
```javascript
const DAILY_CREDIT_LIMIT = 50; // Change to 100, 200, etc.
```

### Change AI Model
File: `src/utils/api.js`
```javascript
model: "claude-sonnet-4-20250514", // Try other models
```

---

Need more help? Check `FIREBASE_SETUP.md` for detailed explanations.

Enjoy! 🔥
