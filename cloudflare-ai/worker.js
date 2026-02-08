export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { messages } = await request.json();

    const result = await env.AI.run(
      "@cf/meta/llama-3.2-11b-vision-instruct",
      {
        messages,
        max_tokens: 512,
      }
    );

    return new Response(
      JSON.stringify({ text: result.response }),
      { headers: { "Content-Type": "application/json" } }
    );
  },
};
