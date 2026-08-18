import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // per-user, never cache

// Returns the signed-in user's account-level entitlement keys from the Supabase
// `entitlements` table (written by the Stripe webhook). This is what makes Pro
// follow a user across devices. Fully env-gated: if Supabase or Clerk aren't
// configured, it returns an empty list and the app falls back to per-device unlocks.
export async function GET(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const configured = !!(url && key);

  // `?check=1` is a setup diagnostic: it reports whether the Supabase env vars are
  // present and whether the `entitlements` table is reachable, so the wiring can be
  // confirmed without making a purchase. It exposes no keys, no schema, and no rows.
  if (new URL(req.url).searchParams.get("check") === "1") {
    if (!configured) return NextResponse.json({ configured: false, table: "not-checked" });
    // Hit PostgREST directly: the raw HTTP status is unambiguous where the client
    // library can swallow the cause (401 = bad key, 404 = table missing, 200 = fine).
    const raw = key!;
    const k = raw.trim().replace(/^["']|["']$/g, ""); // tolerate stray quotes/whitespace from copy-paste
    const shape = {
      len: raw.length,
      hadWhitespace: raw !== raw.trim(),
      hadQuotes: /^["']|["']$/.test(raw.trim()),
      kind: k.startsWith("sb_secret_") ? "secret" : k.startsWith("sb_publishable_") ? "PUBLISHABLE (wrong key — need the secret one)" : k.startsWith("eyJ") ? "legacy-jwt" : "unrecognized",
      urlLooksRight: /^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test((url ?? "").trim()),
    };
    try {
      const res = await fetch(`${(url ?? "").trim().replace(/\/$/, "")}/rest/v1/entitlements?select=grant_key&limit=1`, {
        headers: { apikey: k, Authorization: `Bearer ${k}` },
      });
      const body = (await res.text()).slice(0, 300);
      return NextResponse.json({
        configured: true,
        table: res.ok ? "ok" : "unreachable",
        httpStatus: res.status,
        ...(res.ok ? {} : { reason: body }),
        ...shape,
      });
    } catch (e) {
      return NextResponse.json({ configured: true, table: "unreachable", reason: (e as Error).message, ...shape });
    }
  }

  if (!configured) return NextResponse.json({ keys: [], configured });

  // Resolve the current user's email via Clerk (server-side).
  let email: string | null = null;
  try {
    const { currentUser } = await import("@clerk/nextjs/server");
    const u = await currentUser();
    email = u?.primaryEmailAddress?.emailAddress ?? u?.emailAddresses?.[0]?.emailAddress ?? null;
  } catch {
    /* Clerk not configured / no request context */
  }
  if (!email) return NextResponse.json({ keys: [], configured });

  try {
    const { createClient } = await import("@supabase/supabase-js");
    // Normalize: dashboard copy-paste can carry a trailing newline or wrapping quotes,
    // which otherwise fails auth with an unhelpful empty error.
    const db = createClient(url.trim().replace(/\/$/, ""), key.trim().replace(/^["']|["']$/g, ""));
    const { data } = await db
      .from("entitlements")
      .select("grant_key,status")
      .eq("email", email)
      .in("status", ["active", "trialing"]);
    const keys = (data ?? []).map((r) => (r as { grant_key: string }).grant_key).filter(Boolean);
    return NextResponse.json({ keys, configured });
  } catch {
    return NextResponse.json({ keys: [], configured });
  }
}
