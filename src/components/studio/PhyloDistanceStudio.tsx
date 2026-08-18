"use client";

import { useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function PhyloDistanceStudio() {
  const [length, setLength] = useState(300), [diffs, setDiffs] = useState(45);
  const p = Math.min(0.74, diffs / length);
  const jc = p < 0.75 ? -0.75 * Math.log(1 - (4 / 3) * p) : Infinity;
  const identity = (1 - p) * 100;
  const mya = jc * 100; // illustrative: substitutions/site × calibration

  return (
    <StudioChrome title="Phylogenetic Distance" tagline="turning mutations into a tree"
      controls={<div>
        <Slider label="Sequence length (bp)" value={length} min={50} max={1000} step={10} onChange={setLength} />
        <Slider label="Observed differences" value={diffs} min={0} max={Math.floor(length * 0.6)} step={1} onChange={setDiffs} />
        <p className="mt-3 text-xs text-slate-500">The more two DNA sequences differ, the longer ago they shared an ancestor. But raw differences undercount, because a site can mutate more than once. The Jukes–Cantor correction inflates the raw distance to estimate the true number of substitutions per site. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Percent identity" value={`${identity.toFixed(1)}%`} />
        <Stat label="Raw distance p" value={p.toFixed(3)} />
        <Stat label="Jukes–Cantor distance" value={isFinite(jc) ? jc.toFixed(3) : "saturated"} />
        <Stat label="Est. divergence" value={isFinite(mya) ? `${mya.toFixed(0)} (relative)` : "—"} />
      </div>}
    ><div className="flex h-[320px] flex-col items-center justify-center gap-6 rounded-lg bg-slate-950">
      <div className="font-mono text-xs text-cyan-300">Seq A: ...ACGT<span className="text-pink-400">A</span>CGT<span className="text-pink-400">T</span>ACG...</div>
      <svg width="300" height="120" viewBox="0 0 300 120">
        <line x1="20" y1="60" x2="120" y2="60" stroke="#475569" strokeWidth="2" />
        <line x1="120" y1="60" x2="120" y2="30" stroke="#475569" strokeWidth="2" />
        <line x1="120" y1="60" x2="120" y2="90" stroke="#475569" strokeWidth="2" />
        <line x1="120" y1="30" x2={120 + Math.min(160, (isFinite(jc) ? jc : 1) * 300)} y2="30" stroke="#22d3ee" strokeWidth="2" />
        <line x1="120" y1="90" x2={120 + Math.min(160, (isFinite(jc) ? jc : 1) * 300)} y2="90" stroke="#f472b6" strokeWidth="2" />
        <text x={125 + Math.min(160, (isFinite(jc) ? jc : 1) * 300)} y="34" fill="#67e8f9" fontSize="12">Seq A</text>
        <text x={125 + Math.min(160, (isFinite(jc) ? jc : 1) * 300)} y="94" fill="#fb7185" fontSize="12">Seq B</text>
      </svg>
      <div className="font-mono text-xs text-pink-300">Seq B: ...ACGT<span className="text-pink-400">G</span>CGT<span className="text-pink-400">C</span>ACG...</div>
    </div></StudioChrome>
  );
}
