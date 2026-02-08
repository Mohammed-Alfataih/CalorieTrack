/**
 * Call Cloudflare AI Worker
 * Supports text and image prompts
 */
export async function callAI(messages) {
  // Send request directly to your Cloudflare Worker
  const res = await fetch("https://calorie-ai.calorietrack.workers.dev", {
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

  // Parse response
  const data = await res.json();

  // Clean code blocks if present
  return data.text.replace(/```json|```/g, "").trim();
}

/**
 * Convert file to base64 for image prompts
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
 * Build prompt for image scan
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
