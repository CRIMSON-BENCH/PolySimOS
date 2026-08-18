"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// S-N (Wohler) fatigue curve.
export function FatigueStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uts, setUts] = useState(500); // MPa
  const [stress, setStress] = useState(300); // applied amplitude MPa
  const [steel, setSteel] = useState(true);

  const Se = steel ? 0.5 * uts : 0.4 * uts; // endurance limit
  // Basquin: between 10^3 (0.9 UTS) and 10^6 (Se)
  const s1000 = 0.9 * uts; const b = (Math.log10(s1000) - Math.log10(Se)) / (Math.log10(1e6) - Math.log10(1e3));
  const cyclesFor = (s: number) => { if (steel && s <= Se) return Infinity; const logN = 3 + (Math.log10(s1000) - Math.log10(s)) / b; return Math.pow(10, logN); };
  const N = cyclesFor(stress);

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
        <Slider label="Ultimate strength (MPa)" value={uts} min={200} max={1200} step={20} onChange={setUts} />
        <Slider label="Stress amplitude (MPa)" value={stress} min={50} max={uts} step={10} onChange={setStress} />
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" checked={steel} onChange={(e) => setSteel(e.target.checked)} /> Ferrous (has endurance limit)</label>
        <p className="mt-3 text-xs text-slate-500">Repeated loading well below the ultimate strength can still break a part — metal fatigue. The S-N curve plots stress amplitude against cycles to failure. Steels have an endurance limit: below it they last essentially forever, but aluminum has none and eventually fails at any stress. Cause of many catastrophic aircraft and bridge failures.</p>
      </div>}
      inspector={<div><Stat label="Endurance limit" value={`${Se.toFixed(0)} MPa`} /><Stat label="Cycles to failure" value={isFinite(N) ? N.toExponential(2) : "infinite"} /><Stat label="Verdict" value={isFinite(N) ? "finite life" : "safe (below Se)"} /></div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
