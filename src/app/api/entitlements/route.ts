import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // per-user, never cache

// Returns the signed-in user's account-level entitlement keys from the Supabase
// `entitlements` table (written by the Stripe webhook). This is what makes Pro
// follow a user across devices. Fully env-gated: if Supabase or Clerk aren't
// configured, it returns an empty list and the app falls back to per-device unlocks.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ keys: [] });

  // Resolve the current user's email via Clerk (server-side).
  let email: string | null = null;
  try {
    const { currentUser } = await import("@clerk/nextjs/server");
    const u = await currentUser();
    email = u?.primaryEmailAddress?.emailAddress ?? u?.emailAddresses?.[0]?.emailAddress ?? null;
  } catch {
    /* Clerk not configured / no request context */
  }
  if (!email) return NextResponse.json({ keys: [] });

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(url, key);
    const { data } = await db
      .from("entitlements")
      .select("grant_key,status")
      .eq("email", email)
      .in("status", ["active", "trialing"]);
    const keys = (data ?? []).map((r) => (r as { grant_key: string }).grant_key).filter(Boolean);
    return NextResponse.json({ keys });
  } catch {
    return NextResponse.json({ keys: [] });
  }
}
