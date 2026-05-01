export interface Env {
  AI: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
      }

      const body = await request.json();

      // Accept OpenAI-style messages format
      const messages = body.messages;
      if (!messages || !Array.isArray(messages)) {
        return jsonResponse({ error: "Invalid request format" }, 400);
      }

      const lastMessage = messages[messages.length - 1];
      const content = lastMessage?.content;

      // Detect image scan
      if (Array.isArray(content)) {
        const imagePart = content.find((c: any) => c.image_base64);
        if (!imagePart) {
          return jsonResponse({ error: "No image provided" }, 400);
        }

        // Fake response for now (so frontend never breaks)
        return jsonResponse({
          foodName: "Detected Food",
          foodNameAr: "طعام",
          calories: 250,
        });
      }

      // Detect text estimate
      const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
  messages: [
    {
      role: "system",
      content: "Return ONLY JSON: {\"foodName\":\"string\",\"foodNameAr\":\"string\",\"calories\":number}"
    },
    {
      role: "user",
      content: `Estimate calories for: ${content}`
    }
  ],
  max_tokens: 200,
});

const raw = result?.response || "";
const jsonMatch = raw.match(/\{[\s\S]*\}/);
if (!jsonMatch) return jsonResponse({ error: "AI returned invalid JSON" }, 500);
return jsonResponse(JSON.parse(jsonMatch[0]));

    } catch (err: any) {
      return jsonResponse(
        { error: err.message || "Server error" },
        500
      );
    }
  },
};

// Helper to ALWAYS return JSON
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
