"use client";

import { useState } from "react";
import { copyCurrentLink, copyText } from "@/lib/studioKit";

// A row of preset-scenario chips. Each preset applies a named parameter set.
export function Presets({ presets, onApply }: { presets: { label: string; hint?: string }[]; onApply: (label: string) => void }) {
  return (
    <div className="mb-3">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Presets</p>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.label}
            title={p.hint}
            onClick={() => onApply(p.label)}
            className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// "Explain this result" — a static, rules-based one-liner. Zero AI tokens.
export function ExplainResult({ text }: { text: string }) {
  return (
    <div className="mt-3 rounded-lg border border-amber-300/40 bg-amber-50/60 p-2.5 text-[12px] leading-relaxed text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-200">
      <span className="font-semibold">Reading this result: </span>
      {text}
    </div>
  );
}

// Share + copy-as-code toolbar. `code` is the generated Python/MATLAB the user can paste.
export function ShareBar({ code, codeLabel = "Copy as Python" }: { code?: string; codeLabel?: string }) {
  const [linkMsg, setLinkMsg] = useState("Copy link");
  const [codeMsg, setCodeMsg] = useState(codeLabel);

  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
      <button
        onClick={async () => {
          const ok = await copyCurrentLink();
          setLinkMsg(ok ? "Link copied ✓" : "Press ⌘C");
          setTimeout(() => setLinkMsg("Copy link"), 1600);
        }}
        className="rounded-md border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300"
      >
        🔗 {linkMsg}
      </button>
      {code && (
        <button
          onClick={async () => {
            const ok = await copyText(code);
            setCodeMsg(ok ? "Code copied ✓" : "Press ⌘C");
            setTimeout(() => setCodeMsg(codeLabel), 1600);
          }}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300"
        >
          {"</>"} {codeMsg}
        </button>
      )}
      {code && (
        <a
          href="/console"
          onClick={() => { try { sessionStorage.setItem("polysim:pycode", code); } catch { /* ignore */ } }}
          title="Open this snippet in the in-browser Python console"
          className="rounded-md border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300"
        >
          ▶ Run in Python
        </a>
      )}
    </div>
  );
}
