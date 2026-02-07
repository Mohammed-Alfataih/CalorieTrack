# CalorieTrack Setup Guide 🚀

Complete setup guide for Google Authentication + AI Credits per user.

## What You'll Need

- Node.js 14+ ([Download](https://nodejs.org/))
- An Anthropic API key ([Get here](https://console.anthropic.com/))
- A Google account for Firebase ([Console](https://console.firebase.google.com/))

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name your project: "CalorieTrack" (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create project"

---

## Step 2: Enable Google Authentication

1. In Firebase Console, click "Authentication" in left sidebar
2. Click "Get Started"
3. Click "Sign-in method" tab
4. Click "Google" → Toggle "Enable" → Save

---

## Step 3: Get Firebase Configuration

1. In Firebase Console, click ⚙️ (Settings) → "Project settings"
2. Scroll down to "Your apps" section
3. Click the web icon (</>) to add a web app
4. Name it "CalorieTrack Web"
5. Click "Register app"
6. **Copy the firebaseConfig object** — you'll need these values!

It looks like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxx"
};
```

---

## Step 4: Install Dependencies

Open terminal in the CalorieTrack folder:

```bash
npm install
```

---

## Step 5: Configure Environment Variables

Create a file named `.env` in the root folder:

```bash
# Anthropic API
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Firebase (paste your values from Step 3)
REACT_APP_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:xxxxx

# API URL
REACT_APP_API_URL=http://localhost:3001
```

**Get Anthropic API Key:**
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Go to Settings → API Keys
4. Create new key
5. Copy and paste into `.env`

---

## Step 6: Run the Application

Open **TWO** terminal windows:

### Terminal 1 - Backend Server (handles AI + credits)
```bash
npm run proxy
```

You should see:
```
🔥 CalorieTrack API Proxy running on http://localhost:3001
📊 Daily limit: 50 AI calls per user
```

### Terminal 2 - React App
```bash
npm start
```

Browser will open at `http://localhost:3000`

---

## Step 7: Test It Out!

1. Click "Continue with Google"
2. Sign in with your Google account
3. Set your daily calorie goal (e.g., 2000)
4. Test AI features:
   - Type "chicken breast" → Click 🤖 AI button
   - Upload a food photo → AI identifies it
   - Check your AI credits in the top right (50/50)

---

## How It Works

### User Authentication
- Each user logs in with their Google account
- Firebase handles authentication securely
- No passwords to manage!

### AI Credits
- Each user gets **50 AI calls per day**
- Credits reset at midnight
- Credits are tracked per Google account
- View remaining credits in top right corner

### What Counts as an AI Call
- Clicking the 🤖 AI button = 1 credit
- Uploading a photo = 1 credit  
- Adding food without calories = 1 credit (auto-estimate)

### Your Data
- Calorie goals & entries saved to browser localStorage
- Each Google account has separate data
- Data persists across sessions

---

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
**Problem**: Firebase not configured properly

**Solution**:
1. Check `.env` file exists in root folder
2. Verify all `REACT_APP_FIREBASE_*` variables are set
3. Restart both terminal windows

### "Daily AI credit limit reached"
**Problem**: Used all 50 credits today

**Solution**: Wait until midnight for reset, or change `DAILY_CREDIT_LIMIT` in `server.js`

### "No authentication token provided"
**Problem**: Not logged in or session expired

**Solution**: Click your profile picture → Logout → Login again

### Credits Not Tracking
**Problem**: Backend server not running

**Solution**: Make sure Terminal 1 is running `npm run proxy`

### Firebase "Unauthorized domain"
**Problem**: Domain not authorized in Firebase Console

**Solution**:
1. Go to Firebase Console → Authentication → Settings
2. Add `localhost` to "Authorized domains"

---

## Customization

### Change Daily Credit Limit

Edit `server.js` line 15:
```javascript
const DAILY_CREDIT_LIMIT = 50; // Change this number
```

### Change Models

Edit `src/utils/api.js`:
```javascript
model: "claude-sonnet-4-20250514", // Try other models
```

---

## Production Deployment

For deploying to production (Vercel, Netlify, etc.):

1. **Add production domain to Firebase**:
   - Firebase Console → Authentication → Settings → Authorized domains
   - Add your domain (e.g., `calorietrack.vercel.app`)

2. **Deploy backend separately**:
   - Deploy `server.js` to a cloud service (Heroku, Railway, etc.)
   - Update `REACT_APP_API_URL` to your backend URL

3. **Set environment variables**:
   - Add all `.env` variables to your hosting platform
   - Keep `ANTHROPIC_API_KEY` on backend only

4. **Enable HTTPS**:
   - Required for Firebase Authentication

---

## Security Notes

- ⚠️ Never commit `.env` file to git
- ✅ API key stays on backend server only
- ✅ Users can only use their own credits
- ✅ Firebase handles all authentication securely

---

## File Structure

```
CalorieTrack/
├── .env                    ← Your secrets (create this!)
├── .env.example            ← Template
├── server.js               ← Backend (credit tracking)
├── package.json
├── src/
│   ├── firebase/
│   │   └── config.js       ← Firebase setup
│   ├── contexts/
│   │   └── AuthContext.jsx ← Auth state
│   ├── components/
│   │   └── Login/          ← Google sign-in
│   └── utils/
│       └── api.js          ← API calls (with auth)
```

---

## Need Help?

Common issues:
- **Can't login**: Check Firebase config in `.env`
- **AI not working**: Make sure both terminals are running
- **Credits not resetting**: Restart backend server

Check browser console (F12) for detailed error messages.

---

Enjoy tracking with AI! 🔥
