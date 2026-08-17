"use client";

import { useState } from "react";

// Copies an iframe snippet that embeds this studio on any website.
export function EmbedButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const snippet = `<iframe src="https://www.polysimos.com/embed/${slug}" width="820" height="640" style="border:0;border-radius:12px" title="PolySim OS" allowfullscreen></iframe>`;
  const copy = () => {
    navigator.clipboard?.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-700 dark:text-slate-300"
      title="Copy an iframe to embed this simulation on your own site"
    >
      {copied ? "✓ Embed code copied" : "</> Embed this simulation"}
    </button>
  );
}
