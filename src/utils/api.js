import { auth } from "../firebase/config";

/**
 * Call Claude AI via Netlify Function
 */
export async function callClaude(messages) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to use AI features");
  }

  const token = await user.getIdToken();

  const res = await fetch("/.netlify/functions/claude", {
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
    throw new Error(error.message || "AI request failed");
  }

  const data = await res.json();

  const raw = data.content
    .map(block => (block.type === "text" ? block.text : ""))
    .join("\n");

  return raw.replace(/```json|```/g, "").trim();
}

/**
 * Get remaining credits (optional)
 */
export async function getUserCredits() {
  const user = auth.currentUser;
  if (!user) return null;

  const token = await user.getIdToken();

  const res = await fetch("/.netlify/functions/credits", {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) return null;
  return await res.json();
}

/**
 * Convert file to base64
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
 * Prompt for image scan
 */
export function buildScanPrompt(base64, mimeType) {
  return [
    {
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType || "image/jpeg",
            data: base64,
          },
        },
        {
          type: "text",
          text: `Return ONLY valid JSON:
{"foodName":"English name","foodNameAr":"اسم الطعام بالعربي","calories":number}`,
        },
      ],
    },
  ];
}

/**
 * Prompt for text estimate
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