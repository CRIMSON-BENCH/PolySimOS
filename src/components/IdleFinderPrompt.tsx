"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// After ~30s of no interaction on the home page, gently offer the guided finder.
// Dismissible, and it remembers the dismissal for the session.
export function IdleFinderPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("finderPromptDismissed") === "1") return;
    } catch { /* ignore */ }

    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setShow(true), 30000);
    };
    const onActivity = () => {
      if (!show) arm();
    };
    arm();
    const events = ["mousemove", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, onActivity));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    setShow(false);
    try { sessionStorage.setItem("finderPromptDismissed", "1"); } catch { /* ignore */ }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <button onClick={dismiss} aria-label="Dismiss" className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-xs font-black text-white">✦</span>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Not sure where to start?</p>
      </div>
      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">Tell us what you want to calculate — we&apos;ll point you to the right simulator.</p>
      <Link
        href="/studio?find=1"
        onClick={dismiss}
        className="mt-3 block rounded-lg bg-cyan-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-cyan-700"
      >
        Find my simulator →
      </Link>
    </div>
  );
}
