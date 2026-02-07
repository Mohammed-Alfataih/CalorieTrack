/**
 * Netlify Serverless Function - Get User's Credit Status
 * 
 * Path: /.netlify/functions/credits
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'caloriestrack'
  });
}

// Shared credit storage (same as claude.js)
const userCredits = new Map();
const DAILY_CREDIT_LIMIT = 1000;

function getUserCredits(userId) {
  const today = new Date().toDateString();
  const key = `${userId}:${today}`;
  
  if (!userCredits.has(key)) {
    userCredits.set(key, { count: 0, date: today });
  }
  
  return userCredits.get(key);
}

function getRemainingCredits(userId) {
  const credits = getUserCredits(userId);
  return DAILY_CREDIT_LIMIT - credits.count;
}

async function verifyAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authentication token provided');
  }

  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await admin.auth().verifyIdToken(token);
  return {
    userId: decodedToken.uid,
    email: decodedToken.email
  };
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userId, email } = await verifyAuth(event.headers.authorization);
    
    const remaining = getRemainingCredits(userId);
    const used = getUserCredits(userId).count;
    
    console.log(`📊 Credit check for ${email}: Used ${used}/${DAILY_CREDIT_LIMIT}, Remaining: ${remaining}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        remaining,
        used,
        limit: DAILY_CREDIT_LIMIT,
        resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
      })
    };

  } catch (error) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
