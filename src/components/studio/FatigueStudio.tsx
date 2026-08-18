"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { uts: number; stress: number }> = {
  "Steel, safe": { uts: 400, stress: 150 },
  "Steel, finite life": { uts: 400, stress: 300 },
  "High-strength steel": { uts: 1000, stress: 400 },
  "Near ultimate": { uts: 600, stress: 500 },
};

// S-N (Wohler) fatigue curve.
export function FatigueStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ uts, stress }, update] = useShareableNumbers({ uts: 500, stress: 300 });
  const [steel, setSteel] = useState(true);

  const Se = steel ? 0.5 * uts : 0.4 * uts; // endurance limit
  // Basquin: between 10^3 (0.9 UTS) and 10^6 (Se)
  const s1000 = 0.9 * uts; const b = (Math.log10(s1000) - Math.log10(Se)) / (Math.log10(1e6) - Math.log10(1e3));
  const cyclesFor = (s: number) => { if (steel && s <= Se) return Infinity; const logN = 3 + (Math.log10(s1000) - Math.log10(s)) / b; return Math.pow(10, logN); };
  const N = cyclesFor(stress);

  const explain =
    steel && stress <= Se
      ? `At ${stress} MPa you sit below the ${Se.toFixed(0)} MPa endurance limit, so this ferrous part survives essentially unlimited cycles: the flat tail of the S-N curve is why steel bridges and axles can be designed for infinite life.`
      : `At ${stress} MPa the part fails after about ${isFinite(N) ? N.toExponential(1) : "unlimited"} cycles. ${steel ? "Drop below the " + Se.toFixed(0) + " MPa endurance limit to reach infinite life." : "Non-ferrous metals such as aluminum have no endurance limit, so any repeated stress eventually causes failure."}`;

  const code = `import numpy as np
uts, stress = ${uts}, ${stress}
Se = ${steel ? "0.5" : "0.4"} * uts                # endurance limit
s1000 = 0.9 * uts                          # stress at 10^3 cycles
b = (np.log10(s1000) - np.log10(Se)) / (np.log10(1e6) - np.log10(1e3))
if ${steel ? "True" : "False"} and stress <= Se:
    N = np.inf
else:
    N = 10 ** (3 + (np.log10(s1000) - np.log10(stress)) / b)
print("cycles to failure", N)`;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const logMin = 3, logMax = 8;
    const X = (logN: number) => ox + ((logN - logMin) / (logMax - logMin)) * pw; const Y = (s: number) => oy - (s / (uts * 1.05)) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(3), Y(s1000)); ctx.lineTo(X(6), Y(Se));
    if (steel) ctx.lineTo(X(8), Y(Se)); else { const s8 = s1000 * Math.pow(10, -b * (8 - 3)); ctx.lineTo(X(8), Y(s8)); } ctx.stroke();
    if (steel) { ctx.strokeStyle = "#475569"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(ox, Y(Se)); ctx.lineTo(ox + pw, Y(Se)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText("endurance limit", ox + 4, Y(Se) - 3); }
    // current point
    if (isFinite(N)) { const lx = X(Math.log10(N)); ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(lx, Y(stress), 5, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("stress amplitude (MPa) vs log₁₀(cycles)", ox + 6, oy - ph + 12);
  }, [uts, stress, steel]);

  return (
    <StudioChrome title="Fatigue (S-N Curve)" tagline="failure under cyclic load"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Ultimate strength (MPa)" value={uts} min={200} max={1200} step={20} onChange={(v) => update({ uts: v })} />
        <Slider label="Stress amplitude (MPa)" value={stress} min={50} max={uts} step={10} onChange={(v) => update({ stress: v })} />
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" checked={steel} onChange={(e) => setSteel(e.target.checked)} /> Ferrous (has endurance limit)</label>
        <p className="mt-3 text-xs text-slate-500">Repeated loading well below the ultimate strength can still break a part — metal fatigue. The S-N curve plots stress amplitude against cycles to failure. Steels have an endurance limit: below it they last essentially forever, but aluminum has none and eventually fails at any stress. Cause of many catastrophic aircraft and bridge failures.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Endurance limit" value={`${Se.toFixed(0)} MPa`} /><Stat label="Cycles to failure" value={isFinite(N) ? N.toExponential(2) : "infinite"} /><Stat label="Verdict" value={isFinite(N) ? "finite life" : "safe (below Se)"} /><Equation tex={`N = \\left(\\dfrac{\\sigma_a}{\\sigma_f'}\\right)^{1/b},\\quad \\sigma_a = ${stress.toFixed(0)}\\text{ MPa}\\ \\Rightarrow\\ N = ${isFinite(N) ? `${N.toExponential(2)}\\text{ cycles}` : "\\infty"}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
