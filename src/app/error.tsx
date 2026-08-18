"use client";

import { useEffect } from "react";
import Link from "next/link";

// Route-level error boundary: graceful fallback + beacons the error to our sink.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      const body = JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      });
      navigator.sendBeacon?.("/api/client-error", body) ||
        fetch("/api/client-error", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    } catch {
      /* never let reporting throw */
    }
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Something went wrong</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">
        This simulation hit an unexpected error. It&apos;s been logged automatically — try again, or head back to the studio.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="rounded-lg bg-cyan-600 px-5 py-2.5 font-semibold text-white transition hover:bg-cyan-700">
          Try again
        </button>
        <Link href="/studio" className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          Back to Studio
        </Link>
      </div>
    </div>
  );
}
