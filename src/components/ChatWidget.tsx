"use client";

import { useState, useRef, useEffect } from "react";

type Msg = { role: "user" | "bot"; text: string };

// Floating help assistant powered by the Gemini /api/chatbot route.
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", text: "Hi! I'm the PolySim assistant. Ask me about simulation methods, the studios, or how to model something. (Results are for research and education — validate before relying on them.)" }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [msgs, open]);

  async function send() {
    const q = input.trim(); if (!q || busy) return;
    setInput(""); setMsgs((m) => [...m, { role: "user", text: q }]); setBusy(true);
    try {
      const res = await fetch("/api/chatbot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: q }) });
      const data = await res.json();
      const text = res.ok ? (data?.data?.text ?? "…") : "The assistant isn't configured yet (add an AI API key). Meanwhile, explore the Studio — every simulator runs free in your browser.";
      setMsgs((m) => [...m, { role: "bot", text }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: "Something went wrong. Please try again." }]);
    } finally { setBusy(false); }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-600 text-2xl text-white shadow-lg transition hover:bg-cyan-700"
        aria-label="Open help assistant"
      >
        {open ? "×" : "🤖"}
      </button>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[30rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="font-bold text-slate-900 dark:text-slate-100">PolySim Assistant</p>
            <p className="text-xs text-slate-400">AI assistant</p>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"}`}>{m.text}</div>
              </div>
            ))}
            {busy && <div className="text-xs text-slate-400">thinking…</div>}
          </div>
          <div className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask about a simulation…" className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
            <button onClick={send} disabled={busy} className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">Send</button>
          </div>
        </div>
      )}
    </>
  );
}
