"use client";

import { StudioChrome, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { useShareableNumbers } from "@/lib/studioKit";
import { useState } from "react";

const PRESETS: Record<string, { errorPos: number }> = {
  "No error": { errorPos: 0 },
  "Corrupt a parity bit": { errorPos: 1 },
  "Corrupt a data bit": { errorPos: 3 },
  "Corrupt last bit": { errorPos: 7 },
};

// Hamming(7,4) single-error correction.
export function HammingStudio() {
  const [data, setData] = useState([1, 0, 1, 1]); // d1 d2 d3 d4
  const [{ errorPos }, update] = useShareableNumbers({ errorPos: 0 }); // 0 = none, 1..7 = flip bit

  const [d1, d2, d3, d4] = data;
  const p1 = d1 ^ d2 ^ d4, p2 = d1 ^ d3 ^ d4, p3 = d2 ^ d3 ^ d4;
  // positions: 1=p1 2=p2 3=d1 4=p3 5=d2 6=d3 7=d4
  const code = [p1, p2, d1, p3, d2, d3, d4];
  const received = code.slice(); if (errorPos >= 1 && errorPos <= 7) received[errorPos - 1] ^= 1;
  const [r1, r2, r3, r4, r5, r6, r7] = received;
  const s1 = r1 ^ r3 ^ r5 ^ r7, s2 = r2 ^ r3 ^ r6 ^ r7, s3 = r4 ^ r5 ^ r6 ^ r7;
  const syndrome = s1 + s2 * 2 + s3 * 4;

  const explain =
    errorPos === 0
      ? "No bit was flipped, so all three parity checks pass and the syndrome is 0 — the receiver accepts the codeword unchanged."
      : `The three parity checks fail in a pattern that reads ${syndrome} in binary, pointing straight at position ${syndrome} — exactly the bit you flipped — so Hamming(7,4) both detects and corrects the single error.`;

  const pyCode = `data = [${data.join(", ")}]  # d1..d4
d1, d2, d3, d4 = data
p1, p2, p3 = d1^d2^d4, d1^d3^d4, d2^d3^d4
codeword = [p1, p2, d1, p3, d2, d3, d4]
err = ${errorPos}  # 0 = none, 1..7 = flip that bit
r = codeword[:]
if err: r[err-1] ^= 1
s = (r[0]^r[2]^r[4]^r[6]) + 2*(r[1]^r[2]^r[5]^r[6]) + 4*(r[3]^r[4]^r[5]^r[6])
print("syndrome", s, "-> error at", s or "none")`;

  return (
    <StudioChrome title="Hamming Error Correction" tagline="fixing a flipped bit"
      controls={<div>
        <div className="mb-2 text-xs font-semibold text-slate-500">Data bits (4)</div>
        <div className="flex gap-2">{data.map((b, i) => <button key={i} onClick={() => setData((d) => d.map((x, j) => j === i ? x ^ 1 : x))} className="h-10 w-10 rounded-lg border border-slate-300 font-mono text-lg font-bold text-cyan-300 dark:border-slate-700">{b}</button>)}</div>
        <div className="mt-3 text-xs font-semibold text-slate-500">Corrupt a transmitted bit</div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <input type="range" min={0} max={7} value={errorPos} onChange={(e) => update({ errorPos: +e.target.value })} className="w-full" />
        <div className="text-xs text-slate-400">{errorPos === 0 ? "no error" : `bit ${errorPos} flipped`}</div>
        <p className="mt-3 text-xs text-slate-500">The Hamming(7,4) code adds three parity bits to four data bits so any single-bit error can be found and fixed. Each parity bit checks a different overlapping group; after transmission, recomputing them gives a syndrome whose binary value points straight at the corrupted position. Error-correcting codes like this protect RAM, deep-space links, and QR codes.</p>
        <ShareBar code={pyCode} />
      </div>}
      inspector={<div><Stat label="Parity bits" value={`${p1}${p2}${p3}`} /><Stat label="Syndrome" value={String(syndrome)} /><Stat label="Error at" value={syndrome === 0 ? "none" : `position ${syndrome}`} /><Stat label="Corrected?" value={syndrome === errorPos ? "yes ✓" : syndrome === 0 && errorPos === 0 ? "clean" : "—"} /><Equation tex={`d_{\\min}=3,\\quad R=\\tfrac{k}{n}=\\tfrac{4}{7},\\quad s=(${s3}${s2}${s1})_2=${syndrome}`} /><ExplainResult text={explain} /></div>}
    ><div className="flex flex-col items-center gap-4 py-10 font-mono">
        <div className="text-xs text-slate-500">transmitted codeword (7 bits)</div>
        <div className="flex gap-1">{code.map((b, i) => <span key={i} className="flex h-9 w-9 items-center justify-center rounded border border-slate-700 bg-slate-900 text-cyan-300">{b}</span>)}</div>
        <div className="text-xs text-slate-500">received (with your error)</div>
        <div className="flex gap-1">{received.map((b, i) => <span key={i} className={`flex h-9 w-9 items-center justify-center rounded border ${i + 1 === errorPos ? "border-pink-500 bg-pink-950/40 text-pink-300" : "border-slate-700 bg-slate-900 text-slate-300"}`}>{b}</span>)}</div>
        <div className={`rounded-lg px-4 py-2 text-sm ${syndrome === 0 ? "bg-lime-950/40 text-lime-300" : "bg-cyan-950/40 text-cyan-300"}`}>{syndrome === 0 ? "no error detected" : `error located at position ${syndrome} — correctable`}</div>
      </div></StudioChrome>
  );
}
