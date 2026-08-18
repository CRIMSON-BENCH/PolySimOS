import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Lightweight error sink. Client error boundaries POST here; we log to the server console
// so failures show up in the platform's function logs (e.g. Vercel) with zero third-party
// dependencies. If ERROR_WEBHOOK_URL is set, we also forward a compact payload there.
export async function POST(req: Request) {
  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    /* ignore malformed body */
  }
  const entry = {
    at: new Date().toISOString(),
    message: String(payload.message ?? "unknown"),
    stack: typeof payload.stack === "string" ? payload.stack.slice(0, 2000) : undefined,
    digest: payload.digest,
    url: payload.url,
    ua: req.headers.get("user-agent") ?? undefined,
  };
  // Surfaces in platform logs.
  console.error("[client-error]", JSON.stringify(entry));

  const hook = process.env.ERROR_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) });
    } catch {
      /* best-effort */
    }
  }
  return NextResponse.json({ ok: true });
}
