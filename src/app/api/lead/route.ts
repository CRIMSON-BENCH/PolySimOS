import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Email capture for the value-moment "save your work" prompt (see SaveResultsPrompt).
// Fully env-gated: if Supabase isn't configured (or the `leads` table doesn't exist
// yet), the request still succeeds so the UX never breaks — the lead just isn't stored
// until the table is created (supabase/leads.sql). Never stores anything but email+source.
export async function POST(req: Request) {
  let email = "";
  let source = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim().toLowerCase();
    source = String(body.source ?? "").slice(0, 120);
  } catch {
    /* malformed body */
  }

  // Basic email shape check.
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid email" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const db = createClient(url.trim().replace(/\/$/, ""), key.trim().replace(/^["']|["']$/g, ""));
      await db.from("leads").insert({ email, source });
    } catch {
      /* table missing / transient — don't fail the user-facing capture */
    }
  }

  return NextResponse.json({ ok: true });
}
