# PolySim OS — Cost & Abuse Protection

## What can and can't cost you money

| Area | Who pays the compute | Your exposure |
|---|---|---|
| **All 25 simulators** (WebGPU, physics, math, node graph, notebook) | The visitor's own browser/GPU | **None** — runs client-side, free to serve at any scale |
| **Static site** (2,300+ pages) | Vercel CDN | Minimal (static hosting; well within Vercel limits) |
| **Stripe checkout** | — | **None** — creating checkout sessions is free; only real purchases move money (to you) |
| **Gemini AI endpoints** (copilot, chatbot, etc.) | **You** (your `GEMINI_API_KEY`) | **This is the only real risk** — see below |
| **Supabase Realtime** (collab) | Supabase free tier | None unless you upgrade to a paid tier with overages |

## The one thing to lock down: Gemini spend

The AI routes call Gemini with your key, so unmetered use could run up a bill. Protections now in the code (`src/lib/aiRoutes.ts`):
- **Per-IP rate limit** — default 12 requests/minute (`AI_RATE_PER_MIN`)
- **Global daily cap** — default 4,000 requests/day (`AI_DAILY_CAP`)
- **Input size cap** — default 4,000 chars (`AI_MAX_INPUT_CHARS`)
- Requests over the limit get a 429 and never reach Gemini.

Tune these in Vercel env vars. Lower them if you want to be conservative.

### ⚠️ Do these two things for a hard guarantee
1. **Set a billing cap in Google.** In Google AI Studio / Google Cloud billing, set a budget + hard spend limit on the Gemini API. This is the ultimate backstop — you literally cannot be charged past it, regardless of any code bug. **This is the single most important step.**
2. **(Recommended) Back rate limiting with a shared store.** The in-code limiter is per-serverless-instance (best-effort). For airtight limits across all instances, add **Vercel KV** or **Upstash Redis** and key the limiter on it. (Ask me to wire this — ~30 min.)

### Optional: gate AI behind login
If you'd rather only let signed-in users use AI (so every call is attributable and you can cut off abusers), we can require a Supabase session on the AI routes. The simulators stay free and open; only the Gemini convenience features would need an account. Say the word.

## Model cost note
- Cheap tasks use `gemini-2.5-flash`. A few routes (copilot, report/literature/migrate) use `gemini-2.5-pro`, which is pricier per call. If you want to minimize spend, we can switch those to flash — quality is slightly lower but cost drops significantly.

## Bottom line
The **product itself (simulations) costs you nothing per user**. The only wallet-touching feature is the optional AI layer, and it's now rate-limited + capped in code. Add a Google billing cap and you're fully protected.
