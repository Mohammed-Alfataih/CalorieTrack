# Calorie AI Worker

Cloudflare Worker that uses Workers AI to estimate calories from food descriptions.

## Setup & Deployment

```bash
cd worker
npm install

# Login to Cloudflare
npx wrangler login

# Test locally
npm run dev

# Deploy to production
npm run deploy
```

The worker will be deployed to `https://calorie-ai.<your-subdomain>.workers.dev`.

Update the custom domain to `https://calorie-ai.calorietrack.workers.dev` in the Cloudflare Dashboard under **Workers & Pages → calorie-ai → Settings → Domains & Routes**.

## API

**POST** `/`

### Text Estimation

```json
{ "type": "text", "food": "Chicken sandwich and fries" }
```

**Response:**
```json
{
  "calories": 850,
  "confidence": "medium",
  "breakdown": "Chicken sandwich ~450 cal, fries ~400 cal"
}
```

### Errors

| Status | Meaning |
|--------|---------|
| 400 | Missing/invalid input |
| 502 | AI returned unparseable response |
| 503 | AI service unavailable |

## Notes

- Uses `@cf/meta/llama-3.1-8b-instruct` via the Workers AI binding (no API token needed at runtime)
- The `[ai]` binding in `wrangler.toml` handles authentication automatically
- No `CLOUDFLARE_AI_API_TOKEN` is needed for the Worker itself — that's only for external API calls