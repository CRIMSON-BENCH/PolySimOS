import { NextResponse } from "next/server";
import { Webhook } from "svix";

export const runtime = "nodejs";

// Clerk user webhook (svix-signed). Point Clerk → Configure → Developers →
// Webhooks at https://<domain>/api/webhooks/clerk and subscribe to
// user.created / user.updated / user.deleted. Copy the signing secret from the
// endpoint's detail page (NOT the API-keys page) into CLERK_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not_configured" }, { status: 501 });

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "missing_headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(secret);
  let evt: { type?: string };
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type?: string };
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  // evt.type: user.created / user.updated / user.deleted.
  // Entitlements are keyed by email (device-local + Stripe webhook), so there's
  // no user table to sync yet — this endpoint verifies and acknowledges, ready
  // to wire to a store when account-synced entitlements are added.
  return NextResponse.json({ ok: true, type: evt.type ?? null });
}
