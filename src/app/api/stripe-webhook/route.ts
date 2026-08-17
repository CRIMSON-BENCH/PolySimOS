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
    case "checkout.session.completed": {
      const s = event.data.object as { customer_details?: { email?: string | null }; customer?: string | null; metadata?: Record<string, string> | null };
      const email = s.customer_details?.email ?? null;
      const grantKey = s.metadata?.grantKey ?? null;
      if (grantKey) await recordEntitlement({ email, customer: s.customer ?? null, grantKey, status: "active" });
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as { customer?: string | null; metadata?: Record<string, string> | null; status?: string };
      const grantKey = sub.metadata?.grantKey ?? null;
      if (grantKey) await recordEntitlement({ email: null, customer: sub.customer ?? null, grantKey, status: sub.status ?? "active" });
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as { customer?: string | null; metadata?: Record<string, string> | null };
      const grantKey = sub.metadata?.grantKey ?? null;
      if (grantKey) await recordEntitlement({ email: null, customer: sub.customer ?? null, grantKey, status: "canceled" });
      break;
    }
    case "invoice.payment_failed":
      // Optional: notify the user of a failed payment (email/webhook).
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

// Best-effort persistence to Supabase `entitlements` table. No-ops safely until
// SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) are configured — the
// client-side entitlement store keeps unlocks working per-device in the meantime.
async function recordEntitlement(row: { email: string | null; customer: string | null; grantKey: string; status: string }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(url, key);
    await db.from("entitlements").upsert(
      { email: row.email, stripe_customer: row.customer, grant_key: row.grantKey, status: row.status },
      { onConflict: "stripe_customer,grant_key" }
    );
  } catch {
    /* logging/persistence unavailable — ignore (payment already succeeded) */
  }
}
