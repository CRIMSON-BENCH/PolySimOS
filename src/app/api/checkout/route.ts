import { NextResponse } from "next/server";
import { getProduct } from "@/lib/products";
import { getStripe, priceIdForSlug, siteBaseUrl } from "@/lib/stripe";
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
  try {
    ({ slug } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const product = getProduct(slug);
  if (!product || product.price === 0) {
    return NextResponse.json({ error: "Unknown or free product." }, { status: 400 });
  }

  const isSub = product.billing === "subscription";
  const base = siteBaseUrl();
  const existingPrice = priceIdForSlug(slug);

  // Prefer a pre-existing Stripe Price if configured; otherwise build one on the fly.
  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = existingPrice
    ? { price: existingPrice, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(product.price * 100),
          product_data: { name: product.name, description: product.blurb },
          ...(isSub ? { recurring: { interval: product.interval === "year" ? "year" : "month" } } : {}),
        },
      };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isSub ? "subscription" : "payment",
      line_items: [lineItem],
      success_url: `${base}/dashboard?success=1&product=${slug}`,
      cancel_url: `${base}/tools/${slug}?canceled=1`,
      metadata: { slug },
      allow_promotion_codes: true,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
