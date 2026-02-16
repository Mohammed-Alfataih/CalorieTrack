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

    if (!hasCreditsRemaining(userId)) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: 'Daily AI credit limit reached' })
      };
    }

    const requestBody = JSON.parse(event.body || '{}');
    const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL || 'https://calorie-ai.calorietrack.workers.dev';

    // Transform messages → worker expected format
    let workerBody: any;
    if (requestBody.messages && requestBody.messages.length > 0) {
      const lastMessage = requestBody.messages[requestBody.messages.length - 1];
      const content = lastMessage?.content;

      if (Array.isArray(content)) {
        const imageBase64 = content.find((c: any) => c.image_base64)?.image_base64;
        workerBody = imageBase64 ? { type: "image", image: imageBase64 } : { type: "text", food: "Unknown food from image" };
      } else if (typeof content === 'string') {
        const foodMatch = content.match(/Food:\s*(.+)/)?.[1]?.trim();
        workerBody = { type: "text", food: foodMatch || content };
      } else {
        workerBody = { type: "text", food: requestBody.foodName || "Unknown" };
      }
    } else if (requestBody.type) {
      workerBody = requestBody;
    } else {
      workerBody = { type: "text", food: requestBody.foodName || "Unknown" };
    }

    const response = await fetch(cloudflareWorkerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workerBody),
    });

    // ✅ FIX: Always parse JSON safely
    let data: any;
    try {
      data = await response.json();
    } catch {
      data = { foodName: workerBody.food || "Unknown", foodNameAr: workerBody.food || "Unknown", calories: 0 };
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
        foodName: data.foodName || workerBody.food || "Unknown",
        foodNameAr: data.foodNameAr || workerBody.food || "Unknown",
        calories: data.calories || 0,
        confidence: data.confidence || "medium",
        breakdown: data.breakdown || null,
        text: "", // remove "No additional info" to prevent frontend warnings
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
