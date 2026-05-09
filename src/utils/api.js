import { getAuth } from "firebase/auth";

const BASE_URL = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;

// Safety check
if (!BASE_URL) {
  console.error("❌ Missing VITE_CLOUDFLARE_WORKER_URL in .env");
}

/**
 * Get user credits (ONLY if backend supports it)
 */
export async function getUserCredits() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) return { credits: 0, remaining: 0 };

  const token = await user.getIdToken();

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: "credits",
      }),
    });

    const data = await res.json().catch(() => ({}));

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
 * Call AI backend (Cloudflare Worker ONLY)
 */
export async function callAI(messages) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error("User not logged in");

  const token = await user.getIdToken();

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  });

  const data = await res.json().catch(async () => {
    const text = await res.text();
    return { error: text };
  });

  if (!res.ok) {
    throw new Error(data.error || "AI request failed");
  }

  return data;
}

/**
 * Convert file to base64
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * IMAGE PROMPT (FIXED)
 */
export function buildScanPrompt(base64) {
  return [
    {
      role: "user",
      content: [
        {
          image_base64: base64,
        },
      ],
    },
  ];
}

/**
 * TEXT PROMPT (FIXED)
 */
export function buildEstimatePrompt(foodName) {
  return [
    {
      role: "user",
      content: foodName,
    },
  ];
}