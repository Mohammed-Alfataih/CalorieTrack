
export interface Env {
  AI: any;
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    try {
      const body = await request.json();
      const messages = body.messages;

      if (!messages || !Array.isArray(messages)) {
        return jsonResponse({ error: "Invalid request format" }, 400);
      }

      const lastMessage = messages[messages.length - 1];
      const content = lastMessage?.content;

      let foodDescription = "";

      // Image scan
      if (Array.isArray(content)) {
        const imagePart = content.find((c: any) => c.image_base64);
        if (!imagePart) return jsonResponse({ error: "No image provided" }, 400);

        // Use AI to describe the image first
        const visionResult = await env.AI.run("@cf/llava-hf/llava-1.5-7b-hf", {
          image: [...Uint8Array.from(atob(imagePart.image_base64), c => c.charCodeAt(0))],
          prompt: "What food is in this image? List all visible foods with approximate portion sizes.",
          max_tokens: 256,
        });

        foodDescription = visionResult?.description || visionResult?.response || "unknown food";
      } else if (typeof content === "string") {
        foodDescription = content;
      } else {
        return jsonResponse({ error: "Unsupported content type" }, 400);
      }

      // Step 1: Estimate calories
      const calorieResult = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          {
            role: "system",
            content: `You are a professional nutritionist. Given a food item, respond with ONLY valid JSON — no markdown, no explanation. Format:
{"foodName":"<english name>","calories":<number>,"confidence":"<low|medium|high>","breakdown":{"protein":<g>,"carbs":<g>,"fat":<g>}}
Rules:
- calories must be a realistic non-zero number (unless it's water/zero-cal drinks)
- Use standard serving sizes if not specified
- confidence: high if common food, medium if ambiguous, low if unclear`
          },
          { role: "user", content: `Estimate calories for: ${foodDescription}` }
        ],
        max_tokens: 200,
      });

      let parsed: any;
      try {
        const raw = calorieResult?.response || "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        parsed = null;
      }

      if (!parsed || !parsed.foodName) {
        parsed = { foodName: foodDescription, calories: 0, confidence: "low", breakdown: null };
      }

      // Step 2: Translate to Arabic
      const translateResult = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          {
            role: "system",
            content: "Translate the following food name to Arabic. Reply with ONLY the Arabic translation, nothing else."
          },
          { role: "user", content: parsed.foodName }
        ],
        max_tokens: 50,
      });

      const foodNameAr = translateResult?.response?.trim() || parsed.foodName;

      return jsonResponse({
        foodName: parsed.foodName,
        foodNameAr,
        calories: parsed.calories || 0,
        confidence: parsed.confidence || "medium",
        breakdown: parsed.breakdown || null,
      });

    } catch (err: any) {
      console.error("Worker error:", err);
      return jsonResponse({ error: err.message || "Server error" }, 500);
    }
  },
};
