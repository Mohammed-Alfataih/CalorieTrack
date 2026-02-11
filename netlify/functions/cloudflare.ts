import * as admin from 'firebase-admin';
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'caloriestrack'
  });
}

// In-memory credit storage (reset on cold starts)
interface UserCredits { count: number; date: string; }
const userCredits = new Map<string, UserCredits>();
const DAILY_CREDIT_LIMIT = 1000;

function getUserCredits(userId: string): UserCredits {
  const today = new Date().toDateString();
  const key = `${userId}:${today}`;
  if (!userCredits.has(key)) userCredits.set(key, { count: 0, date: today });
  return userCredits.get(key)!;
}

function hasCreditsRemaining(userId: string): boolean {
  return getUserCredits(userId).count < DAILY_CREDIT_LIMIT;
}

function incrementCredits(userId: string): void {
  const credits = getUserCredits(userId);
  credits.count += 1;
  userCredits.set(`${userId}:${credits.date}`, credits);
}

function getRemainingCredits(userId: string): number {
  return DAILY_CREDIT_LIMIT - getUserCredits(userId).count;
}

// Verify Firebase token
async function verifyAuth(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('No authentication token provided');
  const token = authHeader.split('Bearer ')[1];
  const decoded = await admin.auth().verifyIdToken(token);
  return { userId: decoded.uid, email: decoded.email || '' };
}

// Main handler
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { userId, email } = await verifyAuth(event.headers.authorization);
    console.log(`✅ Authenticated: ${email} (${userId})`);

    const currentCredits = getUserCredits(userId);
    const remaining = getRemainingCredits(userId);
    console.log(`🔍 Credits: ${currentCredits.count}/${DAILY_CREDIT_LIMIT}, Remaining: ${remaining}`);

    if (!hasCreditsRemaining(userId)) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: 'Daily AI credit limit reached',
          limit: DAILY_CREDIT_LIMIT,
          used: currentCredits.count,
          remaining: 0,
          message: `You've used all ${DAILY_CREDIT_LIMIT} daily AI credits. Credits reset at midnight.`
        })
      };
    }

    const requestBody = JSON.parse(event.body || '{}');
    const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL || 'https://calorie-ai.calorietrack.workers.dev';

    const response = await fetch(cloudflareWorkerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    let data: any;
    try {
      data = await response.json();
    } catch {
      const text = await response.text();
      data = { text };
    }

    if (!response.ok) {
      console.error('Cloudflare Worker error:', data);
      return { statusCode: response.status, headers, body: JSON.stringify(data) };
    }

    // Increment credits
    incrementCredits(userId);
    const newRemaining = getRemainingCredits(userId);

    const responseHeaders = {
      ...headers,
      'X-Credits-Remaining': String(newRemaining),
      'X-Credits-Used': String(getUserCredits(userId).count),
      'X-Credits-Limit': String(DAILY_CREDIT_LIMIT),
    };

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify({
        text: data.text ?? JSON.stringify(data),
        creditsUsed: getUserCredits(userId).count,
        creditsRemaining: newRemaining
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: (error as Error).message.includes('authentication') ? 401 : 500,
      headers,
      body: JSON.stringify({ error: (error as Error).message || 'Internal server error' })
    };
  }
};
