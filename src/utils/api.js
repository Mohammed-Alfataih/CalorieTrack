/**
 * src/utils/api.js
 * 
 * Call Cloudflare AI Worker
 * Supports text and image prompts
 */

/**
 * Call Cloudflare AI Worker
 * @param {Array} messages - array of message objects [{role, content}]
 * @returns {Promise<string>} - text response from AI
 * 
 */
// src/utils/api.js
export async function getUserCredits(userId) {
  // Example: fetch from your backend (replace with real endpoint)
  try {
    const res = await fetch(`/api/credits?uid=${userId}`);
    if (!res.ok) throw new Error("Failed to fetch credits");
    return await res.json(); // returns something like { credits: number }
  } catch (err) {
    console.error(err);
    return { credits: 0 };
  }
}


export async function callAI(messages) {
  const res = await fetch("/.netlify/functions/cloudflare", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "AI request failed");
  }

  const data = await res.json();

  // Remove code blocks if present
  return data.text.replace(/```json|```/g, "").trim();
}

/**
 * Convert a file to base64 (for image prompts)
 * @param {File} file - image file
 * @returns {Promise<string>} - base64 string
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Build prompt for scanning an image for calories
 * @param {string} base64 - base64 image
 * @param {string} mimeType - optional MIME type
 * @returns {Array} - messages array for callAI
 */
export function buildScanPrompt(base64, mimeType = "image/jpeg") {
  return [
    {
      role: "user",
      content: [
        {
          type: "input_image",
          image_base64: base64,
        },
        {
          type: "input_text",
          text: `Return ONLY valid JSON:
{"foodName":"English name","foodNameAr":"اسم الطعام بالعربي","calories":number}`,
        },
      ],
    },
  ];
}

/**
 * Build prompt for text-only calorie estimate
 * @param {string} foodName - name of the food
 * @returns {Array} - messages array for callAI
 */
export function buildEstimatePrompt(foodName) {
  return [
    {
      role: "user",
      content: `Return ONLY valid JSON:
{"foodName":"English name","foodNameAr":"اسم الطعام بالعربي","calories":number}
Food: ${foodName}`,
    },
  ];
}
