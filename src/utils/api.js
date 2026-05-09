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
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "credits",
          },
        ],
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
 * Call AI backend
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
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messages: messages.map((m) => {
        // FIX: ensure content is only string OR image_base64 array
        if (Array.isArray(m.content)) {
          return {
            role: m.role,
            content: m.content.map((c) => {
              if (c.image_base64) {
                return { image_base64: c.image_base64 };
              }
              return c;
            }),
          };
        }

        return {
          role: m.role,
          content: m.content,
        };
      }),
    }),
  });

  const data = await res.json().catch(async () => {
    const text = await res.text();
    return { error: text };
  });

  if (!res.ok) {
    throw new Error(data.error || "AI request failed");
  }

  console.log("callAI:", data);
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