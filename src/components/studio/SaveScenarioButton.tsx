"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

// "Save this setup": stores the current solver URL (slug + tuned query params) to the
// signed-in user's account so they can reload it from the Dashboard. Signed-out users
// get a gentle sign-in nudge. Hidden inside the iOS app? No — saving isn't a purchase,
// so it stays available everywhere.
export function SaveScenarioButton({ slug, name }: { slug: string; name: string }) {
  const { user, configured } = useAuth();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  if (!configured) return null; // accounts not enabled yet

  if (!user) {
    return (
      <Link href="/sign-in" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300">
        ★ Sign in to save this setup
      </Link>
    );
  }

  const save = async () => {
    const path = window.location.pathname + window.location.search;
    const label = window.prompt("Name this setup", name);
    if (label === null) return; // cancelled
    setStatus("saving");
    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name: label || name, path }),
      });
      setStatus(res.ok ? "saved" : "error");
      if (res.ok) setTimeout(() => setStatus("idle"), 4000);
    } catch {
      setStatus("error");
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={save}
        disabled={status === "saving"}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300"
      >
        ★ {status === "saving" ? "Saving…" : "Save this setup"}
      </button>
      {status === "saved" && (
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Saved ✓ <Link href="/dashboard" className="underline">Dashboard</Link>
        </span>
      )}
      {status === "error" && <span className="text-xs text-amber-600 dark:text-amber-400">Couldn&apos;t save — try again.</span>}
    </span>
  );
}
