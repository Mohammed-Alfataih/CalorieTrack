/**
 * Netlify Serverless Function - Hugging Face API Proxy (FREE with Vision)
 * 
 * Uses: Salesforce/blip-image-captioning-large for images
 *       meta-llama/Llama-2-7b-chat-hf for text
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'caloriestrack'
  });
}

// In-memory credit storage
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

function hasCreditsRemaining(userId) {
  const credits = getUserCredits(userId);
  return credits.count < DAILY_CREDIT_LIMIT;
}

function incrementCredits(userId) {
  const credits = getUserCredits(userId);
  credits.count += 1;
  userCredits.set(`${userId}:${credits.date}`, credits);
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

// Helper: Call Hugging Face API
async function callHuggingFace(apiKey, modelId, inputs) {
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${modelId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${error}`);
  }

  return await response.json();
}

// Main handler
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

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
        })
      };
    }

    console.log(`✅ ALLOWED: Making API call...`);

    const requestBody = JSON.parse(event.body);
    const message = requestBody.messages[0];
    
    let aiResponse = '';

    // Check if it's an image request
    const hasImage = Array.isArray(message.content) && 
                     message.content.some(c => c.type === 'image');

    if (hasImage) {
      // Image analysis with BLIP
      console.log('📸 Processing image...');
      
      const imageContent = message.content.find(c => c.type === 'image');
      const textContent = message.content.find(c => c.type === 'text');
      
      // Get image description
      const imageData = imageContent.source.data;
      
      try {
        // Use BLIP for image captioning
        const captionResult = await callHuggingFace(
          process.env.HUGGINGFACE_API_KEY,
          'Salesforce/blip-image-captioning-large',
          imageData
        );
        
        const imageDescription = captionResult[0]?.generated_text || 'food item';
        console.log('Image description:', imageDescription);
        
        // Now use the description to estimate nutrition
        const nutritionPrompt = `Based on this food: "${imageDescription}", provide nutrition info in JSON format:
{"foodName":"${imageDescription}","foodNameAr":"طعام","calories":250}
Return ONLY the JSON, nothing else.`;

        const textResult = await callHuggingFace(
          process.env.HUGGINGFACE_API_KEY,
          'meta-llama/Llama-2-7b-chat-hf',
          nutritionPrompt
        );
        
        aiResponse = textResult[0]?.generated_text || `{"foodName":"${imageDescription}","foodNameAr":"طعام","calories":250}`;
        
      } catch (error) {
        console.error('Image processing error:', error);
        // Fallback response
        aiResponse = '{"foodName":"Food item","foodNameAr":"طعام","calories":200}';
      }
      
    } else {
      // Text-only request
      console.log('💬 Processing text...');
      
      const textPrompt = typeof message.content === 'string' 
        ? message.content 
        : message.content.find(c => c.type === 'text')?.text || '';
      
      try {
        const result = await callHuggingFace(
          process.env.HUGGINGFACE_API_KEY,
          'meta-llama/Llama-2-7b-chat-hf',
          textPrompt
        );
        
        aiResponse = result[0]?.generated_text || '{"foodName":"Unknown","foodNameAr":"غير معروف","calories":0}';
        
      } catch (error) {
        console.error('Text processing error:', error);
        aiResponse = '{"foodName":"Unknown","foodNameAr":"غير معروف","calories":0}';
      }
    }

    // Increment credits
    incrementCredits(userId);
    const newRemaining = getRemainingCredits(userId);
    console.log(`✅ Success! Credits: ${getUserCredits(userId).count}/${DAILY_CREDIT_LIMIT}, Remaining: ${newRemaining}`);

    // Return in Anthropic-compatible format
    headers['X-Credits-Remaining'] = String(newRemaining);
    headers['X-Credits-Used'] = String(getUserCredits(userId).count);
    headers['X-Credits-Limit'] = String(DAILY_CREDIT_LIMIT);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        content: [{ type: 'text', text: aiResponse }]
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: error.message.includes('authentication') ? 401 : 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Internal server error'
      })
    };
  }
};
``