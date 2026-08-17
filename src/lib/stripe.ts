import Stripe from "stripe";

// Lazily instantiate Stripe so the app builds and runs without keys set.
// Works with your EXISTING Stripe account — only STRIPE_SECRET_KEY is required.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!_stripe) _stripe = new Stripe(key, { apiVersion: "2025-06-30.basil" as Stripe.LatestApiVersion });
  return _stripe;
}

// Optional: map a product slug to a pre-existing Stripe Price ID via env,
// e.g. STRIPE_PRICE_STARTER_TOKEN_PACK=price_123. If not set, we create the
// line item dynamically from price_data so it works with any Stripe account.
export function priceIdForSlug(slug: string): string | undefined {
  const envKey = `STRIPE_PRICE_${slug.toUpperCase().replace(/-/g, "_")}`;
  return process.env[envKey];
}

export function siteBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.polysimos.com";
}
