import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // per-user, never cache

// Saved solver setups for the signed-in user. A scenario = { slug, name, path } where
// path is the solver URL with its tuned query params. Fully env-gated: with no Supabase
// or Clerk configured (or no `scenarios` table yet) it degrades gracefully instead of erroring.

async function resolve() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  let email: string | null = null;
  try {
    const { currentUser } = await import("@clerk/nextjs/server");
    const u = await currentUser();
    email = u?.primaryEmailAddress?.emailAddress ?? u?.emailAddresses?.[0]?.emailAddress ?? null;
  } catch {
    /* Clerk not configured / no request context */
  }
  if (!email) return null;
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(url.trim().replace(/\/$/, ""), key.trim().replace(/^["']|["']$/g, ""));
  return { db, email };
}

export async function GET() {
  const ctx = await resolve();
  if (!ctx) return NextResponse.json({ scenarios: [], configured: false });
  try {
    const { data } = await ctx.db
      .from("scenarios")
      .select("id,slug,name,path,created_at")
      .eq("email", ctx.email)
      .order("created_at", { ascending: false })
      .limit(200);
    return NextResponse.json({ scenarios: data ?? [], configured: true });
  } catch {
    return NextResponse.json({ scenarios: [], configured: true });
  }
}

export async function POST(req: Request) {
  const ctx = await resolve();
  if (!ctx) return NextResponse.json({ ok: false, error: "Sign in to save setups." }, { status: 401 });
  let slug = "", name = "", path = "";
  try {
    const b = await req.json();
    slug = String(b.slug ?? "").slice(0, 80);
    name = String(b.name ?? "").trim().slice(0, 120) || "Untitled setup";
    path = String(b.path ?? "").slice(0, 600);
  } catch {
    /* bad body */
  }
  if (!slug || !path.startsWith("/")) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  try {
    const { data } = await ctx.db.from("scenarios").insert({ email: ctx.email, slug, name, path }).select("id").single();
    return NextResponse.json({ ok: true, id: data?.id ?? null });
  } catch {
    // Table may not exist yet — don't hard-fail the UX.
    return NextResponse.json({ ok: true, id: null, note: "not-persisted" });
  }
}

export async function DELETE(req: Request) {
  const ctx = await resolve();
  if (!ctx) return NextResponse.json({ ok: false }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
  try {
    await ctx.db.from("scenarios").delete().eq("email", ctx.email).eq("id", id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
