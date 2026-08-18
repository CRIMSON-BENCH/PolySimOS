"use client";

import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// Renders a governing equation (KaTeX). Pass a template-literal `tex` with the solver's
// CURRENT values substituted so the math tracks the sliders live.
export function Equation({ tex, label = "Governing equation" }: { tex: string; label?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { throwOnError: false, displayMode: true, output: "html" });
    } catch {
      return "";
    }
  }, [tex]);

  if (!html) return null;
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white/60 p-2.5 dark:border-slate-800 dark:bg-slate-900/50">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="katex-live overflow-x-auto text-[13px] text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
