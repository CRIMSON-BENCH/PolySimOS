"use client";

import { useState } from "react";

// Per-solver AI helper — asks the Gemini-backed /api/chatbot about THIS model.
// The thing you can't do in a desktop tool: ask the page to explain itself.
export function AiSolverAssist({ name, keyword }: { name: string; keyword: string }) {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [loading, setLoading] = useState(false);
  const suggestions = ["Explain the equations behind this", "Where is this used in the real world?", "What do the parameters mean?", "How would I solve this in Python?"];

  async function ask(question: string) {
    if (!question.trim()) return;
    setQ(question); setLoading(true); setA("");
    try {
      const res = await fetch("/api/chatbot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: `About the "${name}" simulator (${keyword}): ${question}` }) });
      const data = await res.json();
      setA(res.ok ? (data?.data?.text ?? "…") : (data?.error || "The AI assistant isn't configured yet."));
    } catch { setA("Something went wrong — please try again."); }
    finally { setLoading(false); }
  }

  return (
    <section className="mt-8 rounded-2xl border border-cyan-300/40 bg-gradient-to-br from-cyan-500/[0.07] via-transparent to-transparent p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-xs font-black text-white">✦</span>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Ask the AI about this model</h2>
      </div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">The math, the assumptions, real-world uses, or a code translation — explained for this exact simulation.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button key={s} onClick={() => ask(s)} disabled={loading} className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300">{s}</button>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="mt-3 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything about this simulation…" className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        <button disabled={loading} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60">{loading ? "Thinking…" : "Ask"}</button>
      </form>
      {a && <div className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white/70 p-3 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">{a}</div>}
    </section>
  );
}
