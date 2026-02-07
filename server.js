/**
 * CalorieTrack API Proxy Server with User Authentication & Credit Tracking
 * 
 * ⚠️ SECURITY WARNING:
 * - The ANTHROPIC_API_KEY environment variable must be kept SECRET
 * - NEVER commit your .env file to git
 * - NEVER expose this key in frontend code
 * - This server is the ONLY place that should access the Anthropic API
 * - Each user must get their own API key from https://console.anthropic.com/
 * 
 * Features:
 * - Verifies Firebase authentication tokens
 * - Tracks daily AI credits per user
 * - Resets credits at midnight
 * - Prevents credit abuse
 * 
 * Usage:
 * 1. npm install express cors dotenv
 * 2. Create .env with ANTHROPIC_API_KEY (keep it secret!)
 * 3. node server.js
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '.env.backend' });

// Initialize Firebase Admin SDK
const admin = require('firebase-admin');

try {
  admin.initializeApp({
    projectId: 'caloriestrack',
  });
  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  if (error.code !== 'app/duplicate-app') {
    console.error('❌ Firebase Admin init error:', error.message);
  }
}

const app = express();
const PORT = 3001;

// In-memory credit storage (use Redis or database in production)
const userCredits = new Map();
const DAILY_CREDIT_LIMIT = 1000; // Maximum credits per user per day

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper: Get or initialize user credits
function getUserCredits(userId) {
  const today = new Date().toDateString();
  const key = `${userId}:${today}`;
  
  if (!userCredits.has(key)) {
    userCredits.set(key, { count: 0, date: today });
  }
  
  return userCredits.get(key);
}

// Helper: Check if user has credits remaining
function hasCreditsRemaining(userId) {
  const credits = getUserCredits(userId);
  return credits.count < DAILY_CREDIT_LIMIT;
}

// Helper: Increment user credit usage
function incrementCredits(userId) {
  const credits = getUserCredits(userId);
  credits.count += 1;
  userCredits.set(`${userId}:${credits.date}`, credits);
}

// Helper: Get remaining credits
function getRemainingCredits(userId) {
  const credits = getUserCredits(userId);
  return DAILY_CREDIT_LIMIT - credits.count;
}

// Middleware: Verify Firebase ID token and extract real user ID
async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Extract the real user ID from the verified token
    req.userId = decodedToken.uid; // This is the actual Google user ID
    req.userEmail = decodedToken.email;
    
    console.log(`✅ Authenticated user: ${req.userEmail} (ID: ${req.userId})`);
    
    next();
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CalorieTrack API Proxy is running',
    dailyLimit: DAILY_CREDIT_LIMIT
  });
});

// Debug endpoint - view all credits (remove in production)
app.get('/api/debug/credits', (req, res) => {
  const allCredits = {};
  for (const [key, value] of userCredits.entries()) {
    allCredits[key] = value;
  }
  res.json({
    dailyLimit: DAILY_CREDIT_LIMIT,
    allUserCredits: allCredits,
    totalUsers: userCredits.size
  });
});

// Test endpoint - simulate credit check without using Anthropic API
app.post('/api/test/credit-check', verifyAuth, (req, res) => {
  const currentCredits = getUserCredits(req.userId);
  const remaining = getRemainingCredits(req.userId);
  const hasCredits = hasCreditsRemaining(req.userId);
  
  console.log(`\n🧪 TEST CREDIT CHECK for ${req.userEmail}:`);
  console.log(`   User ID: ${req.userId}`);
  console.log(`   Used: ${currentCredits.count}/${DAILY_CREDIT_LIMIT}`);
  console.log(`   Remaining: ${remaining}`);
  console.log(`   Has credits: ${hasCredits}\n`);
  
  res.json({
    userId: req.userId,
    email: req.userEmail,
    used: currentCredits.count,
    limit: DAILY_CREDIT_LIMIT,
    remaining: remaining,
    hasCreditsRemaining: hasCredits,
    wouldAllow: hasCredits ? "YES - Would allow API call" : "NO - Would block API call"
  });
});

// Get user's remaining credits
app.get('/api/credits', verifyAuth, (req, res) => {
  const remaining = getRemainingCredits(req.userId);
  const used = getUserCredits(req.userId).count;
  
  console.log(`📊 Credit check for ${req.userEmail}: Used ${used}/${DAILY_CREDIT_LIMIT}, Remaining: ${remaining}`);
  
  res.json({
    remaining,
    used,
    limit: DAILY_CREDIT_LIMIT,
    resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
  });
});

// Proxy endpoint for Claude API with credit checking
app.post('/api/claude', verifyAuth, async (req, res) => {
  try {
    // Validate API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured. Please set ANTHROPIC_API_KEY in your .env.backend file' 
      });
    }

    // Check if user has credits remaining
    const currentCredits = getUserCredits(req.userId);
    const remaining = getRemainingCredits(req.userId);
    
    console.log(`\n🔍 CREDIT CHECK for ${req.userEmail}:`);
    console.log(`   User ID: ${req.userId}`);
    console.log(`   Used: ${currentCredits.count}`);
    console.log(`   Limit: ${DAILY_CREDIT_LIMIT}`);
    console.log(`   Remaining: ${remaining}`);
    console.log(`   Has credits? ${currentCredits.count} < ${DAILY_CREDIT_LIMIT} = ${currentCredits.count < DAILY_CREDIT_LIMIT}`);
    
    if (!hasCreditsRemaining(req.userId)) {
      const resetTime = new Date(new Date().setHours(24, 0, 0, 0));
      console.log(`❌ BLOCKED: User has no credits remaining\n`);
      return res.status(429).json({ 
        error: 'Daily AI credit limit reached',
        limit: DAILY_CREDIT_LIMIT,
        used: currentCredits.count,
        remaining: 0,
        resetTime: resetTime.toISOString(),
        message: `You've used all ${DAILY_CREDIT_LIMIT} daily AI credits. Credits reset at midnight.`
      });
    }

    console.log(`✅ ALLOWED: User has ${remaining} credits remaining\n`);
    console.log(`📡 Making API call to Anthropic...`);

    // Make the API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('API Error:', data);
      return res.status(response.status).json(data);
    }

    // Increment user's credit usage AFTER successful API call
    incrementCredits(req.userId);

    const newCredits = getUserCredits(req.userId);
    const remainingFfter = getRemainingCredits(req.userId);
    console.log(`✅ API SUCCESS - Credits updated:`);
    console.log(`   Used: ${newCredits.count}/${DAILY_CREDIT_LIMIT}`);
    console.log(`   Remaining: ${remaining}\n`);
    
    // Add credit info to response headers
    res.setHeader('X-Credits-Remaining', remainingAfter);
    res.setHeader('X-Credits-Used', newCredits.count);
    res.setHeader('X-Credits-Limit', DAILY_CREDIT_LIMIT);
    
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cleanup old credit data (runs every hour)
setInterval(() => {
  const today = new Date().toDateString();
  for (const [key, value] of userCredits.entries()) {
    if (value.date !== today) {
      userCredits.delete(key);
      console.log(`Cleaned up old credit data for ${key}`);
    }
  }
}, 60 * 60 * 1000); // Every hour

app.listen(PORT, () => {
  console.log(`🔥 CalorieTrack API Proxy running on http://localhost:${PORT}`);
  console.log(`📍 Endpoint: http://localhost:${PORT}/api/claude`);
  console.log(`💳 Credits: http://localhost:${PORT}/api/credits`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Daily limit: ${DAILY_CREDIT_LIMIT} AI calls per user`);
});
