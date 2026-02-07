import { auth } from "../firebase/config";

/**
 * Calls the backend proxy which forwards to Anthropic API.
 * Includes Firebase auth token for user identification and credit tracking.
 *
 * @param {Array} messages — standard Anthropic messages array
 * @returns {Promise<string>} cleaned response text
 */
export async function callClaude(messages) {
  // Get current user's auth token
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to use AI features");
  }

  const token = await user.getIdToken();

  // Call our backend proxy instead of Anthropic directly
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
  
  const res = await fetch(`${API_URL}/api/claude`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    
    // Handle credit limit errors specially
    if (res.status === 429) {
      throw new Error(error.message || "Daily AI credit limit reached. Try again tomorrow!");
    }
    
    console.error("API Error:", error);
    throw new Error(error.error?.message || error.message || "API request failed");
  }

  const data = await res.json();
  
  // Log remaining credits to console
  const creditsRemaining = res.headers.get('X-Credits-Remaining');
  if (creditsRemaining !== null) {
    console.log(`AI Credits remaining today: ${creditsRemaining}`);
  }
  
  const raw = data.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n");

  return raw.replace(/```json|```/g, "").trim();
}

/**
 * Fetch user's remaining AI credits
 * @returns {Promise<{remaining: number, used: number, limit: number}>}
 */
export async function getUserCredits() {
  const user = auth.currentUser;
  if (!user) return null;

  const token = await user.getIdToken();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
  
  const res = await fetch(`${API_URL}/api/credits`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    console.error("Failed to fetch credits");
    return null;
  }

  return await res.json();
}

/**
 * Reads a File object and returns its base64-encoded data (without the data-URL prefix).
 *
 * @param {File} file
 * @returns {Promise<string>} base64 string
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ─── Prompt builders ─────────────────────────────────────────────────────── */

/**
 * Builds the messages array for scanning a food photo.
 * Asks Claude for English name, Arabic name, and calorie estimate.
 */
export function buildScanPrompt(base64, mimeType) {
  return [
    {
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mimeType || "image/jpeg", data: base64 },
        },
        {
          type: "text",
          text: [
            "Look at this food photo. Return ONLY valid JSON, nothing else:",
            '{"foodName":"English name here","foodNameAr":"اسم الطعام بالعربي هنا","calories":number}',
            "Identify the food, give its name in BOTH English and Arabic,",
            "and estimate calories for the portion shown.",
          ].join("\n"),
        },
      ],
    },
  ];
}

/**
 * Builds the messages array for estimating calories from a typed food name.
 * Also normalises the name into both languages.
 */
export function buildEstimatePrompt(foodName) {
  return [
    {
      role: "user",
      content: [
        `The user typed this food: "${foodName}". Return ONLY valid JSON:`,
        '{"foodName":"English name","foodNameAr":"اسم الطعام بالعربي","calories":number}',
        "Correct / normalize the food name in both languages and estimate calories for a typical serving.",
      ].join("\n"),
    },
  ];
}
