"use client";

import { useEffect } from "react";

// Root-level error boundary (replaces the whole document on a layout-level crash).
// Renders its own <html>/<body> and beacons the error to our sink.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      const body = JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        fatal: true,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      });
      navigator.sendBeacon?.("/api/client-error", body) ||
        fetch("/api/client-error", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    } catch {
      /* never let reporting throw */
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#020617", color: "#e2e8f0", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", margin: 0 }}>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 480 }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ marginTop: "0.75rem", color: "#94a3b8" }}>
            PolySim hit an unexpected error. It&apos;s been logged automatically.
          </p>
          <button onClick={reset} style={{ marginTop: "1.5rem", background: "#0891b2", color: "#fff", border: 0, borderRadius: 8, padding: "0.6rem 1.25rem", fontWeight: 600, cursor: "pointer" }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
