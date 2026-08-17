import { NextResponse } from "next/server";
import { getStripe, priceIdForSlug, siteBaseUrl } from "@/lib/stripe";
import { resolveSku } from "@/lib/pricing";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Checkout isn't configured yet. Add STRIPE_SECRET_KEY to enable purchases." },
      { status: 503 }
    );
  }

  let slug: string;
  let cycle: "month" | "year" | undefined;
  let next: string | undefined;
  try {
    ({ slug, cycle, next } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const sku = resolveSku(slug, cycle);
  if (!sku) {
    return NextResponse.json({ error: "Unknown or free product." }, { status: 400 });
  }

  const base = siteBaseUrl();
  // Prefer a pre-existing Stripe Price if one is configured for a catalog slug.
  const existingPrice = sku.metadata.kind === "product" || sku.metadata.kind === "subscription"
    ? priceIdForSlug(slug)
    : undefined;

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = existingPrice
    ? { price: existingPrice, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: sku.amount,
          product_data: { name: sku.name, description: sku.description },
          ...(sku.mode === "subscription" ? { recurring: { interval: sku.interval ?? "month" } } : {}),
        },
      };

  const nextPath = next && next.startsWith("/") ? next : "/dashboard";
  const success = `${base}/unlocked?k=${encodeURIComponent(sku.grantKey)}&next=${encodeURIComponent(nextPath)}`;
  const referer = req.headers.get("referer");
  const cancel = referer && referer.startsWith(base) ? referer : `${base}${nextPath}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: sku.mode,
      line_items: [lineItem],
      success_url: success,
      cancel_url: cancel,
      metadata: { ...sku.metadata, grantKey: sku.grantKey },
      allow_promotion_codes: true,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
