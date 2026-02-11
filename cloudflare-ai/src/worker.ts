/// <reference types="@cloudflare/workers-types" />

export interface Env {
  AI: Ai;
}

interface RequestBody {
  type: "text" | "image";
  food?: string;
  image?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    let body: RequestBody;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    if (body.type === "text") {
      return handleTextEstimation(body.food, env);
    }

    if (body.type === "image") {
      return jsonResponse(
        { error: "Image estimation is not yet supported" },
        501
      );
    }

    return jsonResponse(
      { error: "Invalid request type. Use 'text' or 'image'." },
      400
    );
  },
};

async function handleTextEstimation(
  food: string | undefined,
  env: Env
): Promise<Response> {
  if (!food || food.trim().length === 0) {
    return jsonResponse({ error: "Missing 'food' field" }, 400);
  }

  if (food.length > 500) {
    return jsonResponse(
      { error: "Food description too long (max 500 chars)" },
      400
    );
  }

  const prompt = `Estimate the TOTAL calories for the food described below.

Respond ONLY with JSON:
{"calories": <int>, "confidence": "low" | "medium" | "high", "breakdown": "<short sentence>"}

Food:
"${food.trim()}"`;

  try {
    const MODEL = "@cf/meta/llama-3.1-8b-instruct" as any;

const response = await env.AI.run(MODEL, {
  messages: [{ role: "user", content: prompt }],
  max_tokens: 256,
  temperature: 0.3,
});


    const raw = (response as { response?: string }).response ?? "";
    const match = raw.match(/\{[\s\S]*?\}/);

    if (!match) {
      return jsonResponse({ error: "AI returned invalid JSON" }, 502);
    }

    const parsed = JSON.parse(match[0]);
    const calories = Number(parsed.calories);

    if (!Number.isFinite(calories) || calories <= 0) {
      return jsonResponse({ error: "Invalid calorie value" }, 502);
    }

    return jsonResponse({
      calories: Math.round(calories),
      confidence: parsed.confidence ?? "medium",
      breakdown: parsed.breakdown ?? null,
    });
  } catch (err) {
    return jsonResponse({ error: "AI service unavailable" }, 503);
  }
}
