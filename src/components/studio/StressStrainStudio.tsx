"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const MAT: Record<string, { E: number; yield: number; uts: number; strain: number; label: string }> = {
  "Mild steel": { E: 200, yield: 250, uts: 400, strain: 0.25, label: "ductile" },
  Aluminum: { E: 69, yield: 95, uts: 110, strain: 0.15, label: "ductile" },
  "Cast iron": { E: 170, yield: 0, uts: 200, strain: 0.01, label: "brittle" },
  Rubber: { E: 0.05, yield: 0, uts: 15, strain: 5, label: "elastomer" },
};

export function StressStrainStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mat, setMat] = useState("Mild steel");
  const [strain, setStrain] = useState(0.05);

  const m = MAT[mat]; const yieldStrain = m.yield / (m.E * 1000);
  const stressAt = (e: number) => { if (e <= yieldStrain || m.yield === 0) return Math.min(m.uts, e * m.E * 1000); const plasticFrac = (e - yieldStrain) / (m.strain - yieldStrain); return m.yield + (m.uts - m.yield) * Math.min(1, plasticFrac * 1.6) * (1 - plasticFrac * 0.3); };
  const curStress = stressAt(Math.min(strain, m.strain));

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const eMax = m.strain * 1.05, sMax = m.uts * 1.15;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 200; i++) { const e = (i / 200) * m.strain; const y = oy - (stressAt(e) / sMax) * ph; i ? ctx.lineTo(ox + (e / eMax) * pw, y) : ctx.moveTo(ox + (e / eMax) * pw, y); } ctx.stroke();
    // markers
    if (m.yield) { const yy = oy - (m.yield / sMax) * ph; ctx.strokeStyle = "#475569"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(ox, yy); ctx.lineTo(ox + pw, yy); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText("yield", ox + 4, yy - 3); }
    const uy = oy - (m.uts / sMax) * ph; ctx.fillStyle = "#f9a8d4"; ctx.font = "10px sans-serif"; ctx.fillText("UTS", ox + pw - 26, uy - 3);
    // current point
    const cx = ox + (Math.min(strain, m.strain) / eMax) * pw, cy = oy - (curStress / sMax) * ph; ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("stress (MPa) vs strain", ox + 6, oy - ph + 12);
  }, [mat, strain]);

  const region = strain <= yieldStrain || m.yield === 0 ? "elastic" : strain >= m.strain ? "fractured" : "plastic";
  return (
    <StudioChrome title="Stress-Strain Curve" tagline="tensile testing"
      controls={<div>
        <div className="mb-3 grid grid-cols-2 gap-2">{Object.keys(MAT).map((k) => <button key={k} onClick={() => { setMat(k); setStrain(MAT[k].strain * 0.3); }} className={`rounded-lg px-2 py-1 text-xs font-semibold ${mat === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{k}</button>)}</div>
        <Slider label="Applied strain" value={strain} min={0} max={m.strain} step={m.strain / 100} onChange={setStrain} />
        <p className="mt-3 text-xs text-slate-500">Pull on a material and its stress-strain curve tells its story: a straight elastic region with slope equal to Young&apos;s modulus, a yield point where permanent deformation begins, a peak at the ultimate tensile strength, and finally fracture. Ductile metals stretch far; brittle ones like cast iron snap with almost no warning.</p>
      </div>}
      inspector={<div><Stat label="Young's modulus" value={`${m.E} GPa`} /><Stat label="Current stress" value={`${curStress.toFixed(0)} MPa`} /><Stat label="UTS" value={`${m.uts} MPa`} /><Stat label="Region" value={region} /></div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
