"use client";

import { StudioChrome, Stat } from "./StudioChrome";
import { useState } from "react";

export function ShannonEntropyStudio() {
  const [pw, setPw] = useState("Tr0ub4dour");

  let pool = 0; if (/[a-z]/.test(pw)) pool += 26; if (/[A-Z]/.test(pw)) pool += 26; if (/[0-9]/.test(pw)) pool += 10; if (/[^A-Za-z0-9]/.test(pw)) pool += 33;
  const entropy = pw.length * Math.log2(pool || 1);
  const combos = Math.pow(pool || 1, pw.length); const guessesPerSec = 1e10; const seconds = combos / 2 / guessesPerSec;
  const fmt = (s: number) => s < 1 ? "instant" : s < 60 ? `${s.toFixed(0)} s` : s < 3600 ? `${(s / 60).toFixed(0)} min` : s < 86400 ? `${(s / 3600).toFixed(0)} hr` : s < 3.15e7 ? `${(s / 86400).toFixed(0)} days` : s < 3.15e11 ? `${(s / 3.15e7).toFixed(0)} yr` : `${(s / 3.15e7).toExponential(1)} yr`;
  const strength = entropy < 28 ? "very weak" : entropy < 36 ? "weak" : entropy < 60 ? "reasonable" : entropy < 128 ? "strong" : "very strong";

  return (
    <StudioChrome title="Shannon Entropy & Passwords" tagline="measuring information & strength"
      controls={<div>
        <label className="text-xs font-semibold text-slate-500">Password / string</label>
        <input className="w-full rounded-lg border border-slate-300 bg-transparent px-2 py-1 font-mono text-sm dark:border-slate-700" value={pw} onChange={(e) => setPw(e.target.value)} />
        <p className="mt-3 text-xs text-slate-500">Shannon entropy measures information in bits — how many yes/no questions it takes to pin down a value. For a password it is length times the log₂ of the character-set size, quantifying how unpredictable it is. Each extra bit doubles the guessing effort, so length beats complexity: a long passphrase can carry more entropy than a short scramble of symbols.</p>
      </div>}
      inspector={<div><Stat label="Character pool" value={String(pool)} /><Stat label="Entropy" value={`${entropy.toFixed(1)} bits`} /><Stat label="Strength" value={strength} /><Stat label="Crack time" value={fmt(seconds)} /></div>}
    ><div className="flex flex-col items-center justify-center py-16">
        <div className="text-xs uppercase tracking-widest text-slate-500">Entropy</div>
        <div className="mt-3 text-7xl font-black" style={{ color: entropy < 36 ? "#ef4444" : entropy < 60 ? "#fbbf24" : "#a3e635" }}>{entropy.toFixed(0)}<span className="ml-2 text-3xl text-slate-400">bits</span></div>
        <div className="mt-4 h-4 w-72 rounded-full bg-slate-800"><div className="h-4 rounded-full" style={{ width: `${Math.min(100, entropy / 128 * 100)}%`, backgroundColor: entropy < 36 ? "#ef4444" : entropy < 60 ? "#fbbf24" : "#a3e635" }} /></div>
        <div className="mt-2 text-sm text-slate-500">brute-force time: {fmt(seconds)}</div>
      </div></StudioChrome>
  );
}
