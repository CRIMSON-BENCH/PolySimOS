import { NextResponse } from "next/server";
import { runJson, runText, geminiConfigured } from "./gemini";

// --- Abuse / cost guards for the Gemini-backed endpoints -------------------
// These protect your Gemini spend from runaway or malicious use. Tunable via
// env: AI_RATE_PER_MIN (per-IP/minute), AI_DAILY_CAP (global/day),
// AI_MAX_INPUT_CHARS (request size). Note: this is best-effort in-memory
// limiting (per serverless instance). For hard guarantees also (1) set a
// billing cap in Google AI Studio / Google Cloud, and (2) back rate limiting
// with a shared store like Vercel KV / Upstash. See COST-AND-ABUSE.md.
const RATE_PER_MIN = Number(process.env.AI_RATE_PER_MIN ?? 12);
const DAILY_CAP = Number(process.env.AI_DAILY_CAP ?? 4000);
const MAX_INPUT = Number(process.env.AI_MAX_INPUT_CHARS ?? 4000);

const hits = new Map<string, number[]>();
let day = "";
let dayCount = 0;

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (xff ? xff.split(",")[0] : req.headers.get("x-real-ip")) || "unknown";
}

function rateLimited(req: Request): { blocked: boolean; reason?: string } {
  // global daily cap (resets on UTC day change or cold start)
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) { day = today; dayCount = 0; }
  if (dayCount >= DAILY_CAP) return { blocked: true, reason: "Daily AI limit reached. Please try again tomorrow." };

  // per-IP sliding window (last 60s)
  const ip = clientIp(req);
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (arr.length >= RATE_PER_MIN) return { blocked: true, reason: "You're sending requests too quickly. Please wait a moment." };
  arr.push(now); hits.set(ip, arr);
  dayCount++;
  if (hits.size > 5000) hits.clear(); // avoid unbounded growth
  return { blocked: false };
}

export async function handleAi(
  req: Request,
  build: (input: Record<string, unknown>) => { prompt: string; model?: "flash" | "pro"; json?: boolean }
) {
  if (!geminiConfigured()) {
    return NextResponse.json(
      { error: "AI features aren't configured yet. Add GEMINI_API_KEY to enable them." },
      { status: 503 }
    );
  }
  const gate = rateLimited(req);
  if (gate.blocked) return NextResponse.json({ error: gate.reason }, { status: 429 });

  let input: Record<string, unknown>;
  let rawLen = 0;
  try {
    const text = await req.text();
    rawLen = text.length;
    input = JSON.parse(text || "{}");
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (rawLen > MAX_INPUT) {
    return NextResponse.json({ error: "Input too large." }, { status: 413 });
  }

  const { prompt, model = "flash", json = true } = build(input);
  try {
    const data = json ? await runJson(prompt, model) : { text: await runText(prompt, model) };
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
