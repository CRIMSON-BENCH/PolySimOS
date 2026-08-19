"use client";

import { useState } from "react";
import { copyText } from "@/lib/studioKit";

// Copy an <iframe> snippet so anyone can drop this live solver into their own page.
export function EmbedButton({ slug, name = "Live simulation" }: { slug: string; name?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // The attribution link lives OUTSIDE the iframe, in the host page's own HTML,
  // so it counts as a real followed backlink to the solver (not an iframe-internal link).
  const snippet = `<div style="max-width:640px;margin:0 auto">
  <iframe src="https://www.polysimos.com/embed/${slug}" width="640" height="540" style="border:0;border-radius:12px;max-width:100%;width:100%" title="${name} — PolySim OS" loading="lazy"></iframe>
  <p style="margin:6px 0 0;font:13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;text-align:right">
    <a href="https://www.polysimos.com/studio/${slug}" target="_blank" rel="noopener" style="color:#0891b2;text-decoration:none">Made with PolySim OS →</a>
  </p>
</div>`;

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300"
      >
        {"</>"} Embed this simulation
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-2 text-xs text-slate-500">Paste this into any webpage, blog, or LMS — it stays live and interactive.</p>
          <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-2.5 text-[11px] leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">{snippet}</pre>
          <button
            onClick={async () => { const ok = await copyText(snippet); setCopied(ok); setTimeout(() => setCopied(false), 1600); }}
            className="mt-2 rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-700"
          >
            {copied ? "Copied ✓" : "Copy embed code"}
          </button>
        </div>
      )}
    </div>
  );
}
