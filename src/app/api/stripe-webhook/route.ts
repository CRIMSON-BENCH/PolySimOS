import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Stripe webhook handler. Configure the endpoint URL in your Stripe dashboard
// to https://<your-domain>/api/stripe-webhook and set STRIPE_WEBHOOK_SECRET.
// Handles: checkout.session.completed, customer.subscription.created/updated/deleted,
// invoice.payment_failed.
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ received: false, error: "Webhook not configured." }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  const body = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${(e as Error).message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      // TODO: grant access / record purchase in Supabase using event.data.object
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      // TODO: sync subscription status
      break;
    case "customer.subscription.deleted":
      // TODO: revoke access
      break;
    case "invoice.payment_failed":
      // TODO: notify user of failed payment
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
