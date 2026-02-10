/**
 * Netlify Serverless Function - Cloudflare AI Proxy with Credit Tracking
 * 
 * Path: /.netlify/functions/claude.ts
 * 
 * Environment Variables needed in Netlify:
 * - FIREBASE_PROJECT_ID (set to: caloriestrack)
 * - CLOUDFLARE_WORKER_URL (set to: https://calorie-ai.calorietrack.workers.dev)
 */

import * as admin from 'firebase-admin';
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'caloriestrack'
  });
}

interface UserCredits {
  count: number;
  date: string;
}

interface AuthResult {
  userId: string;
  email: string;
}

// In-memory credit storage (shared across function invocations)
const userCredits = new Map<string, UserCredits>();
const DAILY_CREDIT_LIMIT = 1000;

// Helper: Get or initialize user credits
function getUserCredits(userId: string): UserCredits {
  const today = new Date().toDateString();
  const key = `${userId}:${today}`;
  
  if (!userCredits.has(key)) {
    userCredits.set(key, { count: 0, date: today });
  }
  
  return userCredits.get(key)!;
}

// Helper: Check if user has credits remaining
function hasCreditsRemaining(userId: string): boolean {
  const credits = getUserCredits(userId);
  return credits.count < DAILY_CREDIT_LIMIT;
}

// Helper: Increment user credit usage
function incrementCredits(userId: string): void {
  const credits = getUserCredits(userId);
  credits.count += 1;
  userCredits.set(`${userId}:${credits.date}`, credits);
}

// Helper: Get remaining credits
function getRemainingCredits(userId: string): number {
  const credits = getUserCredits(userId);
  return DAILY_CREDIT_LIMIT - credits.count;
}

// Verify Firebase token and extract user ID
async function verifyAuth(authHeader: string | undefined): Promise<AuthResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authentication token provided');
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return {
      userId: decodedToken.uid,
      email: decodedToken.email || ''
    };
  } catch (error) {
    console.error('Token verification failed:', (error as Error).message);
    throw new Error('Invalid authentication token');
  }
}

// Main handler
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Verify authentication
    const { userId, email } = await verifyAuth(event.headers.authorization);
    
    console.log(`✅ Authenticated: ${email} (${userId})`);

    // Check credits
    const currentCredits = getUserCredits(userId);
    const remaining = getRemainingCredits(userId);
    
    console.log(`🔍 Credits: ${currentCredits.count}/${DAILY_CREDIT_LIMIT}, Remaining: ${remaining}`);
    
    if (!hasCreditsRemaining(userId)) {
      console.log(`❌ BLOCKED: No credits remaining`);
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

    console.log(`✅ ALLOWED: Making API call to Cloudflare Worker...`);

    // Parse request body
    const requestBody = JSON.parse(event.body || '{}');

    // Call Cloudflare Worker instead of Anthropic API
    const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL || 'https://calorie-ai.calorietrack.workers.dev';
    
    const response = await fetch(cloudflareWorkerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cloudflare Worker error:', data);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify(data)
      };
    }

    // Increment credits AFTER successful call
    incrementCredits(userId);
    
    const newRemaining = getRemainingCredits(userId);
    console.log(`✅ Success! Credits: ${getUserCredits(userId).count}/${DAILY_CREDIT_LIMIT}, Remaining: ${newRemaining}`);

    // Add credit info to response headers
    const responseHeaders = {
      ...headers,
      'X-Credits-Remaining': String(newRemaining),
      'X-Credits-Used': String(getUserCredits(userId).count),
      'X-Credits-Limit': String(DAILY_CREDIT_LIMIT)
    };

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: (error as Error).message.includes('authentication') ? 401 : 500,
      headers,
      body: JSON.stringify({ 
        error: (error as Error).message || 'Internal server error'
      })
    };
  }
};