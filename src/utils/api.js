import { getAuth } from "firebase/auth";

/**
 * Get user credits from Cloudflare function
 */
export async function getUserCredits() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) return { credits: 0, remaining: 0 };

  const token = await user.getIdToken();

  try {
    const res = await fetch("/.netlify/functions/cloudflare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ messages: [] }), // empty messages just to fetch credits
    });

    if (!res.ok) throw new Error("Failed to fetch credits");

    const data = await res.json();
    return {
      credits: data.creditsUsed ?? 0,
      remaining: data.creditsRemaining ?? 0,
    };
  } catch (err) {
    console.error(err);
    return { credits: 0, remaining: 0 };
  }
}

/**
 * Call Cloudflare AI Worker via Netlify function
 */
export async function callAI(messages) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error("User not logged in");

  const token = await user.getIdToken();

  const res = await fetch("/.netlify/functions/cloudflare", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "AI request failed");
  }

  const data = await res.json();
  if (!data.text) throw new Error("AI response missing text");

  return data.text.replace(/```json|```/g, "").trim();
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
 * Build scan prompt for image
 */
export function buildScanPrompt(base64) {
  return [
    {
      role: "user",
      content: [
        { type: "input_image", image_base64: base64 },
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
 * Build estimate prompt for text
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
