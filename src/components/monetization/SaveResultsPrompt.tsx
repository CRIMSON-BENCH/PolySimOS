"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

const DISMISS_KEY = "psim_save_prompt_dismissed";
const DISMISS_MS = 14 * 24 * 3600 * 1000; // 14 days

// Value-moment prompt: after someone has spent time in a solver, offer to save the
// setup + email the results. Email capture is the bridge to an account/subscription.
// Only shown to signed-out users, dismissible, and never nags again for 14 days.
export function SaveResultsPrompt({ slug, name }: { slug: string; name: string }) {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  useEffect(() => {
    if (user) return; // signed-in users already have saving
    let dismissed = false;
    try {
      const t = localStorage.getItem(DISMISS_KEY);
      dismissed = !!t && Date.now() - Number(t) < DISMISS_MS;
    } catch {
      /* ignore */
    }
    if (dismissed) return;
    const id = setTimeout(() => setShow(true), 20000); // reveal after ~20s of use
    return () => clearTimeout(id);
  }, [user]);

  if (user || !show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  const submit = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: `studio/${slug}` }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-cyan-300/50 bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 p-5 dark:border-cyan-500/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Keep this {name} setup</h3>
          <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-300">
            Save your work and email yourself a link to these exact results — free, no account required to start.
          </p>
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
      </div>

      {status === "done" ? (
        <div className="mt-3 text-sm">
          <p className="font-semibold text-emerald-600 dark:text-emerald-400">✓ Sent — check your inbox.</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            <Link href="/sign-up" className="font-semibold text-cyan-700 underline hover:text-cyan-600 dark:text-cyan-400">Create a free account</Link> to save unlimited setups across devices.
          </p>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
            placeholder="you@email.com"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:max-w-xs"
          />
          <button
            onClick={submit}
            disabled={status === "sending"}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Email me this →"}
          </button>
        </div>
      )}
      {status === "error" && <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">Enter a valid email and try again.</p>}

      {/* Paid upsell hidden inside the iOS app (free-companion, Guideline 3.1.1). */}
      <p data-hide-in-app className="mt-3 text-xs text-slate-500">
        Want more? <Link href="/pricing" className="font-medium text-cyan-700 hover:underline dark:text-cyan-400">Go Pro</Link> for unlimited saves, one-click exports, and the desktop app.
      </p>
    </div>
  );
}
