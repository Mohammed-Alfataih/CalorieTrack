import { ExportedHandler, Ai } from '@cloudflare/workers-types';

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
  async fetch(request: Request, env: Env): Promise<Response> {
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

    return jsonResponse({ error: "Invalid request type. Use 'text' or 'image'." }, 400);
  },
} satisfies ExportedHandler<Env>;

async function handleTextEstimation(food: string | undefined, env: Env) {
  if (!food || food.trim().length === 0) {
    return jsonResponse({ error: "Missing 'food' field" }, 400);
  }

  if (food.trim().length > 500) {
    return jsonResponse({ error: "Food description too long (max 500 chars)" }, 400);
  }

  const prompt = `Task:
Estimate the TOTAL calories for the food described below.

Follow these steps internally (do not show them):

Break the food into its main components.
Estimate calories for each component using typical US restaurant serving sizes unless a portion is specified.
Sum the components to get a total calorie estimate.

Assign confidence:
"high" = common single item with a standard serving
"medium" = multi-item meal or some portion ambiguity
"low" = very vague description or unknown portion size

Important rules:
Do NOT show calculations or reasoning.
Do NOT include explanations, markdown, or extra text.
Always return valid JSON, even if confidence is low.
Calories must be a positive integer representing the total meal.

Food description:
"${food.trim()}"

Respond ONLY with JSON in this exact format:
{"calories": <positive integer>, "confidence": "low" | "medium" | "high", "breakdown": "<one short sentence listing components with approximate calories>"}

Breakdown guidelines:
One sentence maximum
List main components only
Use approximate values (e.g., "Grilled chicken (~280), rice (~200), olive oil (~120)")`;

  try {
    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [{ role: "user", content: prompt }],
      max_tokens: 256,
      temperature: 0.3,
    });

    const raw = (response as { response?: string }).response ?? "";

    // Extract JSON from the response (model may wrap it in markdown)
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.error("AI returned non-JSON:", raw);
      return jsonResponse({ error: "AI returned an unparseable response" }, 502);
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const calories = Number(parsed.calories);
    if (!Number.isFinite(calories) || calories <= 0) {
      return jsonResponse({ error: "AI returned invalid calorie value" }, 502);
    }

    const confidence = ["low", "medium", "high"].includes(parsed.confidence)
      ? parsed.confidence
      : "medium";

    return jsonResponse({
      calories: Math.round(calories),
      confidence,
      breakdown: parsed.breakdown || null,
    });
  } catch (err) {
    console.error("AI.run failed:", err);
    return jsonResponse({ error: "AI service unavailable" }, 503);
  }
}