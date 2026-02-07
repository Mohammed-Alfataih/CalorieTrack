# Troubleshooting Guide 🔧

## Issue 1: "No more credits" even though I didn't use any

### Quick Test:

**While logged in**, open browser console (F12) and run:
```javascript
// Test credit system without using AI
fetch('http://localhost:3001/api/test/credit-check', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${await firebase.auth().currentUser.getIdToken()}`
  }
}).then(r => r.json()).then(console.log)
```

This will show:
```json
{
  "used": 0,
  "limit": 1000,
  "remaining": 1000,
  "hasCreditsRemaining": true,
  "wouldAllow": "YES - Would allow API call"
}
```

If `wouldAllow` is "NO" even though `used` is 0, that's a bug!

### Symptoms:
- First time using the app
- Says "Daily AI credit limit reached"
- You haven't made any AI calls yet

### Causes & Solutions:

#### A) Backend server not restarted properly
```bash
# Stop the backend (Ctrl+C)
# Then restart it:
npm run proxy
```

Look for this message:
```
✅ Firebase Admin SDK initialized
🔥 CalorieTrack API Proxy running on http://localhost:3001
📊 Daily limit: 1000 AI calls per user
```

#### B) Check your actual credits
```bash
# While backend is running, open a new terminal:
curl http://localhost:3001/api/debug/credits
```

This shows all user credits. You should see your user ID with count: 0.

#### C) Clear credit cache
The backend stores credits in memory. Restarting it clears everything:
```bash
# Terminal 1 (backend)
Ctrl+C  # Stop it
npm run proxy  # Restart it
```

#### D) Check browser console for errors
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors when clicking 🤖 AI button
4. If you see "401 Unauthorized" - auth issue
5. If you see "429 Too Many Requests" - credit issue

### Debug Steps:

1. **Check backend logs when you click AI:**
   Terminal 1 should show:
   ```
   ✅ Authenticated user: your@email.com (ID: abc123...)
   🔍 User your@email.com credit check: 0/1000 used
   ```

2. **If you see different user ID:**
   - Logout and login again
   - Clear browser cache
   - Restart both servers

3. **If backend shows errors:**
   ```
   ❌ Auth error: Firebase ID token has expired
   ```
   Solution: Logout and login again

---

## Issue 2: Different Google account shows same data

### Symptoms:
- Login with Account A, see data
- Logout, login with Account B
- Still see Account A's data

### Cause:
Browser localStorage caching

### Solutions:

#### Quick Fix:
```bash
# In browser console (F12):
localStorage.clear()
location.reload()
```

#### Proper Fix:
1. Logout from the app
2. Clear browser cache (Ctrl+Shift+Delete)
3. Close all browser tabs
4. Open fresh tab
5. Go to http://localhost:3000
6. Login with new account

#### Verify it's working:
After login, open browser console (F12) and run:
```javascript
Object.keys(localStorage).filter(k => k.startsWith('user_'))
```

You should see keys like:
```
user_ABC123_ct_goal
user_ABC123_ct_entries
user_ABC123_ct_lang
```

Each Google account has a different ABC123 ID.

---

## Issue 3: Credits not resetting at midnight

### Current Behavior:
Credits are stored in memory and reset when backend restarts.

### To manually reset:
```bash
# Restart backend server
Ctrl+C
npm run proxy
```

### For production:
Add this to server.js to auto-clear daily:
```javascript
// Already implemented! Credits auto-cleanup every hour
```

---

## Issue 4: Firebase authentication errors

### "Firebase: Error (auth/configuration-not-found)"

```bash
# Check .env file exists:
ls -la .env

# If missing, create it:
cp .env.example .env

# Restart React app:
Ctrl+C
npm start
```

### "Firebase Admin SDK initialization failed"

Backend needs proper Firebase setup. Check server logs.

---

## Issue 5: Can't see my files/progress after login

### This is CORRECT behavior if:
- You're logging in for the first time
- You used a different Google account before

### Each Google account gets:
- Their own goal
- Their own food entries  
- Their own language preference
- Their own AI credit count

### To verify:
1. Login with Account A
2. Set goal to 2000
3. Add a food entry
4. Logout
5. Login with Account B
6. You should see: no goal set (first time)
7. Login back with Account A
8. You should see: goal 2000 and your entries

---

## Debugging Checklist

Run these checks in order:

### 1. Backend Server
```bash
# Terminal 1 - is it running?
# Should show:
🔥 CalorieTrack API Proxy running on http://localhost:3001
```

### 2. Frontend Server  
```bash
# Terminal 2 - is it running?
# Should show:
Compiled successfully!
```

### 3. Network Requests
F12 → Network tab → Try AI button
- Should see POST to `localhost:3001/api/claude`
- Status should be 200 (not 401, 429, or 500)

### 4. Backend Logs
Watch Terminal 1 when clicking AI:
```
✅ Authenticated user: your@email.com (ID: xyz123)
🔍 User your@email.com credit check: 5/1000 used
User xyz123 making API call. Credits remaining: 994
Request successful. User xyz123 has 994 credits remaining today.
```

### 5. Credit Status
```bash
curl http://localhost:3001/api/debug/credits
```

Should show your user with low count.

---

## Maximum Credits Explained

- **Limit per user**: 1000 AI calls/day
- **Tracks by**: Google account UID
- **Resets**: Midnight (or restart backend)
- **Counts**: Each 🤖 click, photo upload, auto-estimate

### Why 1000?
- Anthropic free tier: ~1000 requests/day
- Prevents abuse
- Generous for normal use

### To increase:
Edit `server.js` line 46:
```javascript
const DAILY_CREDIT_LIMIT = 5000; // or any number
```

---

## Still Having Issues?

1. **Restart everything:**
   ```bash
   # Stop both terminals (Ctrl+C)
   # Clear node cache
   rm -rf node_modules package-lock.json
   npm install
   # Start fresh
   npm run proxy    # Terminal 1
   npm start        # Terminal 2
   ```

2. **Check versions:**
   ```bash
   node --version   # Should be 14+
   npm --version    # Should be 6+
   ```

3. **Check .env.backend:**
   ```bash
   cat .env.backend
   # Should have: ANTHROPIC_API_KEY=sk-ant-...
   ```

4. **Test backend directly:**
   ```bash
   curl http://localhost:3001/health
   # Should return: {"status":"ok",...}
   ```

---

## Common Mistakes

❌ **Wrong:**
- Using .env for API key (should be .env.backend)
- Not restarting backend after changes
- Expecting same data across different Google accounts
- Forgetting to run npm run proxy

✅ **Correct:**
- API key in .env.backend
- Each user has separate data
- Restart backend after .env.backend changes
- Two terminals: one for backend, one for frontend

---

Need more help? Check server.js console output for detailed error messages.
