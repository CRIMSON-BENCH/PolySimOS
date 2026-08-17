import { NextResponse } from "next/server";
import { runJson, runText, geminiConfigured } from "./gemini";

// Shared helper for building Gemini-backed API routes with graceful degradation.
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
  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { prompt, model = "flash", json = true } = build(input);
  try {
    const data = json ? await runJson(prompt, model) : { text: await runText(prompt, model) };
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
