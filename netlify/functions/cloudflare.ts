import * as admin from 'firebase-admin';
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'caloriestrack'
  });
}

const DAILY_CREDIT_LIMIT = 1000;
const userCredits = new Map<string, { count: number; date: string }>();

function getTodayKey(uid: string) {
  const today = new Date().toDateString();
  return `${uid}:${today}`;
}

function getUserCredits(uid: string) {
  const key = getTodayKey(uid);
  if (!userCredits.has(key)) userCredits.set(key, { count: 0, date: new Date().toDateString() });
  return userCredits.get(key)!;
}

function hasCredits(uid: string) {
  return getUserCredits(uid).count < DAILY_CREDIT_LIMIT;
}

function incrementCredits(uid: string) {
  const credits = getUserCredits(uid);
  credits.count++;
  userCredits.set(getTodayKey(uid), credits);
}

async function verifyAuth(header?: string) {
  if (!header || !header.startsWith('Bearer ')) throw new Error('No authentication token');
  const token = header.split('Bearer ')[1];
  const decoded = await admin.auth().verifyIdToken(token);
  return decoded.uid;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS')
    return { statusCode: 204, headers, body: '' };

  if (event.httpMethod !== 'POST')
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Only POST allowed' }) };

  try {
    const uid = await verifyAuth(event.headers.authorization);

    if (!hasCredits(uid)) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: 'Daily credit limit reached' }),
      };
    }

    const body = JSON.parse(event.body || '{}');

    // Call the Cloudflare AI endpoint
    const remoteRes = await fetch(process.env.CLOUDFLARE_WORKER_URL || '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    let remoteData;
    try {
      remoteData = await remoteRes.json();
    } catch {
      // If fetched worker didn’t return JSON, wrap it
      const text = await remoteRes.text();
      remoteData = { text };
    }

    incrementCredits(uid);
    const credits = getUserCredits(uid);

    // Always produce JSON with fields the frontend expects
    const safeData = {
      foodName: remoteData.foodName ?? '',
      foodNameAr: remoteData.foodNameAr ?? '',
      calories: typeof remoteData.calories === 'number' ? remoteData.calories : 0,
      rawText: remoteData.text ?? '',
      creditsUsed: credits.count,
      creditsRemaining: DAILY_CREDIT_LIMIT - credits.count
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(safeData)
    };
  } catch (err) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: (err as Error).message })
    };
  }
};
