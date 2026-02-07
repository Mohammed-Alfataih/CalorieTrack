import { auth } from "../firebase/config";

/**
 * Call Hugging Face AI via Netlify Function
 */
export async function callHuggingFace(messages) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be logged in to use AI features");
  }

  const token = await user.getIdToken();

  const res = await fetch("/.netlify/functions/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messages, // 👈 your Netlify function expects this
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "AI request failed");
  }

  const data = await res.json();

  // Your function returns Anthropic-like format:
  // { content: [{ type: "text", text: "..." }] }
  const raw = data.content
    .map(block => (block.type === "text" ? block.text : ""))
    .join("\n");

  return raw.replace(/```json|```/g, "").trim();
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
