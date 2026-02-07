# CalorieTrack Setup Guide 🚀

Follow these steps to get your CalorieTrack app running with AI features.

## Prerequisites

- Node.js 14+ installed ([Download](https://nodejs.org/))
- An Anthropic API key ([Get one here](https://console.anthropic.com/))

## Quick Start (3 Steps)

### Step 1: Install Dependencies

Open your terminal in the CalorieTrack folder and run:

```bash
npm install
```

This will install all required packages (React, Express, etc.)

### Step 2: Configure Your API Key

Create a file named `.env` in the root folder (same level as package.json):

```bash
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
REACT_APP_ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

**Where to get your API key:**
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Go to Settings → API Keys
4. Create a new key
5. Copy and paste it into your `.env` file

⚠️ **Important**: Never share your API key or commit the `.env` file to git!

### Step 3: Run the App

You have two options:

#### Option A: Direct Mode (Simpler, but exposes API key in browser)

```bash
npm start
```

The app will open at `http://localhost:3000`

#### Option B: Proxy Mode (Recommended, more secure)

Open **two** terminal windows:

**Terminal 1** (Backend proxy):
```bash
npm run proxy
```

**Terminal 2** (React app):
```bash
npm start
```

Then open `http://localhost:3000`

---

## Testing the AI Features

Once the app is running:

1. **Set a goal**: Enter your daily calorie target (e.g., 2000)
2. **Test AI estimation**: 
   - Type "chicken breast" in the food name field
   - Click the 🤖 AI button
   - AI should fill in the calories (~165)
3. **Test photo scanning**:
   - Click the photo upload area
   - Take/select a photo of food
   - AI should identify the food and estimate calories

---

## Troubleshooting

### "API request failed" or CORS errors

**Problem**: The browser is blocking the API request or your key is invalid.

**Solution**:
- Make sure your `.env` file exists in the root folder
- Check that your API key starts with `sk-ant-`
- Try using the proxy mode (Option B above)

### "Module not found" errors

**Problem**: Dependencies aren't installed.

**Solution**:
```bash
npm install
```

### Photos don't analyze / AI doesn't respond

**Problem**: API key not configured correctly.

**Solution**:
1. Check your `.env` file has the correct key
2. Restart both the app and proxy server
3. Check browser console (F12) for error messages
4. Verify your API key works at https://console.anthropic.com/

### Language switching doesn't work

**Problem**: This is a frontend feature and should work without the API.

**Solution**: Clear your browser cache or localStorage:
```javascript
// In browser console (F12):
localStorage.clear()
location.reload()
```

---

## Production Deployment

For deploying to production (Vercel, Netlify, etc.):

1. **Never** include your API key in client code
2. Use the proxy server (`server.js`) or a serverless function
3. Set environment variables in your hosting platform
4. Enable HTTPS
5. Add rate limiting to prevent abuse

**Example Vercel Deployment**:
- Deploy `server.js` as a Vercel Serverless Function
- Set `ANTHROPIC_API_KEY` in Vercel environment variables
- Update `src/utils/api.js` to call `/api/claude` instead of the direct API

---

## Need Help?

Check the browser console (F12) for error messages. Common issues:
- Missing `.env` file
- Invalid API key format
- CORS errors (use proxy mode)
- File size too large (compress images before uploading)

---

## File Structure

```
CalorieTrack/
├── .env                  ← Your API key (create this!)
├── .env.example          ← Template
├── package.json          ← Dependencies
├── server.js             ← Backend proxy (optional)
├── README.md             ← Overview
├── SETUP_GUIDE.md        ← This file
├── public/
│   └── index.html
└── src/
    ├── components/       ← UI components
    ├── utils/api.js      ← API calls (check this if AI doesn't work)
    └── ...
```

---

## Quick Reference

**Start the app**:
```bash
npm start
```

**Start with proxy**:
```bash
npm run proxy    # Terminal 1
npm start        # Terminal 2
```

**Build for production**:
```bash
npm run build
```

**Check if proxy is running**:
Open `http://localhost:3001/health` in your browser

---

Enjoy tracking your calories! 🔥
