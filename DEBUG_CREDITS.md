# DEBUG: "No More Credits" Issue 🐛

Follow these steps to find the problem:

## Step 1: Check Backend is Running

Terminal 1 should show:
```
✅ Firebase Admin SDK initialized
🔥 CalorieTrack API Proxy running on http://localhost:3001
📊 Daily limit: 1000 AI calls per user
```

If not, run: `npm run proxy`

---

## Step 2: Check Your Actual Credits

While logged in, open browser console (F12) and paste:

```javascript
// Get auth token
const token = await firebase.auth().currentUser.getIdToken();

// Check credits
fetch('http://localhost:3001/api/credits', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  console.log('=== YOUR CREDITS ===');
  console.log('Used:', data.used);
  console.log('Remaining:', data.remaining);
  console.log('Limit:', data.limit);
  console.log('Can use AI:', data.remaining > 0 ? 'YES ✅' : 'NO ❌');
})
```

**Expected output:**
```
=== YOUR CREDITS ===
Used: 0
Remaining: 1000
Limit: 1000
Can use AI: YES ✅
```

**If you see:**
```
Remaining: 0
Can use AI: NO ❌
```

But you haven't used any AI, continue to Step 3.

---

## Step 3: Restart Backend Server

The credit counter might be corrupted. Restart fixes it:

```bash
# Terminal 1 (backend)
Ctrl+C
npm run proxy
```

Then repeat Step 2.

---

## Step 4: Watch Backend Logs

Keep Terminal 1 visible. Now try clicking the 🤖 AI button.

**You should see:**

```
✅ Authenticated user: your@email.com (ID: abc123xyz)

🔍 CREDIT CHECK for your@email.com:
   User ID: abc123xyz
   Used: 0
   Limit: 1000
   Remaining: 1000
   Has credits? 0 < 1000 = true

✅ ALLOWED: User has 1000 credits remaining

📡 Making API call to Anthropic...
✅ API SUCCESS - Credits updated:
   Used: 1/1000
   Remaining: 999
```

**If you see:**
```
❌ BLOCKED: User has no credits remaining
```

Even though Used: 0, that's the bug! Send me this log.

---

## Step 5: Test Credit Logic

Run this test (doesn't use AI, just checks the logic):

```javascript
// In browser console (F12):
const token = await firebase.auth().currentUser.getIdToken();

fetch('http://localhost:3001/api/test/credit-check', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  console.log('=== CREDIT LOGIC TEST ===');
  console.log(JSON.stringify(data, null, 2));
})
```

**Expected:**
```json
{
  "used": 0,
  "limit": 1000,
  "remaining": 1000,
  "hasCreditsRemaining": true,
  "wouldAllow": "YES - Would allow API call"
}
```

**If `wouldAllow` is "NO"** but used is 0, the logic is broken.

---

## Step 6: Check for Multiple User IDs

Maybe you're tracked under different IDs. Check all users:

```bash
curl http://localhost:3001/api/debug/credits
```

Look for your email/ID. You might see:
```json
{
  "allUserCredits": {
    "abc123:Wed Feb 05 2026": { "count": 1000, "date": "Wed Feb 05 2026" },
    "xyz789:Wed Feb 05 2026": { "count": 0, "date": "Wed Feb 05 2026" }
  }
}
```

If there are multiple entries with different IDs, that's the issue!

**Fix:** Logout, restart backend, login again.

---

## Step 7: Clear Everything

Nuclear option - reset everything:

```bash
# Stop both servers (Ctrl+C in both terminals)

# Clear browser storage
# In browser console:
localStorage.clear();
sessionStorage.clear();

# Restart backend fresh
npm run proxy

# Restart frontend
npm start

# Login again
```

---

## Common Issues & Fixes

### Issue: "remaining: 0" even though "used: 0"
**Cause:** Math error (1000 - 0 should be 1000, not 0)
**Fix:** Restart backend server

### Issue: Multiple user IDs for same person
**Cause:** Token changing between requests
**Fix:** Logout, restart backend, login once

### Issue: Credits show "1000 left" but still blocked
**Cause:** Display vs actual credits mismatch  
**Fix:** Check actual credits with Step 2 script

### Issue: Different user IDs every request
**Cause:** Firebase auth token not verifying properly
**Check backend logs for:**
```
❌ Auth error: Firebase ID token has expired
```
**Fix:** Logout and login again

---

## Send Me This Info:

If still broken, send screenshot of:

1. **Browser console showing Step 2 output**
2. **Backend Terminal 1 logs when clicking AI**
3. **Step 5 test result**

This will show exactly what's wrong!
