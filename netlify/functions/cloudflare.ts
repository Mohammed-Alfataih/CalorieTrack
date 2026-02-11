import * as admin from 'firebase-admin';
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'caloriestrack'
  });
}

interface UserCredits { count: number; date: string; }
const userCredits = new Map<string, UserCredits>();
const DAILY_CREDIT_LIMIT = 1000;

function getUserCredits(userId: string): UserCredits {
  const today = new Date().toDateString();
  const key = `${userId}:${today}`;
  if (!userCredits.has(key)) userCredits.set(key, { count: 0, date: today });
  return userCredits.get(key)!;
}

function hasCreditsRemaining(userId: string) {
  return getUserCredits(userId).count < DAILY_CREDIT_LIMIT;
}

function incrementCredits(userId: string) {
  const credits = getUserCredits(userId);
  credits.count += 1;
  userCredits.set(`${userId}:${credits.date}`, credits);
}

function getRemainingCredits(userId: string) {
  return DAILY_CREDIT_LIMIT - getUserCredits(userId).count;
}

async function verifyAuth(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('No authentication token provided');
  const token = authHeader.split('Bearer ')[1];
  const decoded = await admin.auth().verifyIdToken(token);
  return { userId: decoded.uid, email: decoded.email || '' };
}

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
    const currentCredits = getUserCredits(userId);

    if (!hasCreditsRemaining(userId)) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: 'Daily AI credit limit reached' })
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
      // ✅ ALWAYS return JSON, even if the worker returned plain text
      const text = await response.text();
      data = { text };
    }

    incrementCredits(userId);
    const newRemaining = getRemainingCredits(userId);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'X-Credits-Remaining': String(newRemaining),
        'X-Credits-Used': String(getUserCredits(userId).count),
        'X-Credits-Limit': String(DAILY_CREDIT_LIMIT),
      },
      body: JSON.stringify({
        foodName: data.foodName || requestBody.foodName || "Unknown",
        foodNameAr: data.foodNameAr || requestBody.foodName || "Unknown",
        calories: data.calories || 0,
        text: data.text || "No additional info",
        creditsUsed: getUserCredits(userId).count,
        creditsRemaining: newRemaining
      })
    };

  } catch (error) {
    return {
      statusCode: (error as Error).message.includes('authentication') ? 401 : 500,
      headers,
      body: JSON.stringify({ error: (error as Error).message || 'Internal server error' })
    };
  }
};
