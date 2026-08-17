# PolySim OS — Deployment & Go-Live Guide

Everything is now one Next.js app. **Lovable is retired** — no prompt to paste. Follow these steps to go live on Vercel with your existing Stripe account, Gemini, and Supabase.

---

## 1. Deploy to Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and import **CRIMSON-BENCH/PolySimOS** from GitHub.
2. Framework preset: **Next.js** (auto-detected). Build command `next build`, output auto.
3. Add the environment variables below (Settings → Environment Variables), then **Deploy**.
4. Every future `git push` to `main` auto-deploys.

## 2. Environment variables
Copy from `.env.example`. Set these in Vercel (and `.env.local` for local dev):

| Variable | Where to get it | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | Your existing Stripe dashboard → Developers → API keys | Reuses your current account |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same | Public, safe in client |
| `STRIPE_WEBHOOK_SECRET` | Created in step 3 below | |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey | Server-side only |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings | |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings | Server-side only |
| `NEXT_PUBLIC_SITE_URL` | e.g. `https://www.polysimos.com` | Used for checkout redirects & sitemap |

**Never paste keys into chat or commit them.** Vercel encrypts them at rest.

## 3. Stripe (reuses your existing account — nothing is recreated)
Your products, prices, customers, and subscriptions stay exactly as they are.
1. **API keys:** paste your existing `sk_...` and `pk_...` into Vercel (test keys first to verify).
2. **Webhook:** Stripe dashboard → Developers → Webhooks → **Add endpoint**:
   - URL: `https://<your-domain>/api/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy the signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.
3. **Prices (optional):** checkout works out-of-the-box by creating line items dynamically from our catalog. To use *specific existing Stripe Price IDs*, set env vars like `STRIPE_PRICE_STARTER_TOKEN_PACK=price_123` (pattern: `STRIPE_PRICE_<SLUG_IN_CAPS_WITH_UNDERSCORES>`). Our 104-product catalog is in `src/lib/products.ts`.

## 4. Google Gemini (AI features)
1. Create a key at https://aistudio.google.com/apikey.
2. Set `GEMINI_API_KEY` in Vercel. All AI routes (`/api/copilot`, `/api/solver-recommend`, `/api/chatbot`, `/api/materials-lookup`, `/api/estimate-cost`, `/api/analyze-convergence`, `/api/convert-notebook`, `/api/generate-report`, `/api/literature-digest`, `/api/migrate`) use `gemini-2.5-flash`/`pro` server-side. Without the key they return a friendly "not configured" message — the site still works.

## 5. Supabase (auth + storage + DB)
1. Create a project at https://supabase.com.
2. Enable Email + Google + Apple providers (Authentication → Providers).
3. Paste the URL and keys into Vercel.
4. Wire `src/components/AuthForm.tsx` to `supabase.auth.signInWithPassword` / `signInWithOAuth` (the form is already structured for this), and back the dashboard with a `purchases`/`subscriptions` table synced from the Stripe webhook handler (`src/app/api/stripe-webhook/route.ts` has TODO hooks).

## 6. Domain
1. In Vercel → Project → Settings → Domains, add `polysimos.com` and `www.polysimos.com`.
2. Update DNS at your registrar per Vercel's instructions.
3. Point the apex/`www` away from Lovable once the Vercel deploy is verified.

## 7. Decommission Lovable
Once the Vercel site serves your domain and checkout/auth are verified:
1. Confirm no traffic depends on the old `polymath-sim.lovable.app`.
2. Cancel the Lovable subscription. (The old sitemap that pointed at the Lovable subdomain is replaced by `src/app/sitemap.ts`, which emits `polysimos.com` URLs.)

## 8. Post-launch checklist
- [ ] `npm run build` passes locally (it does — 2,250+ pages)
- [ ] Vercel deploy succeeds
- [ ] Stripe test-mode checkout completes end-to-end
- [ ] Webhook receives `checkout.session.completed`
- [ ] Gemini AI route returns a result
- [ ] Supabase login works (email + Google/Apple)
- [ ] Domain resolves to Vercel with HTTPS
- [ ] `robots.txt` and `sitemap.xml` load and reference `polysimos.com`
- [ ] Submit sitemap in Google Search Console
