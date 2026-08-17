"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const ENDS: Record<string, { K: number; label: string }> = {
  "Pinned-pinned": { K: 1.0, label: "both ends pinned" },
  "Fixed-fixed": { K: 0.5, label: "both ends fixed" },
  "Fixed-pinned": { K: 0.7, label: "one fixed, one pinned" },
  "Fixed-free": { K: 2.0, label: "cantilever column" },
};

export function ColumnBucklingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [E, setE] = useState(200); // GPa
  const [I, setI] = useState(10); // 10^6 mm^4
  const [L, setL] = useState(3); // m
  const [ends, setEnds] = useState("Pinned-pinned");
  const [area, setArea] = useState(3000); // mm^2

  const K = ENDS[ends].K; const Le = K * L;
  const Pcr = (Math.PI ** 2 * (E * 1e9) * (I * 1e-6)) / (Le ** 2) / 1000; // kN
  const radiusGyr = Math.sqrt((I * 1e-6) / (area * 1e-6)) * 1000; // mm... I in m^4, A in m^2 -> m, *1000 mm
  const slenderness = (Le * 1000) / radiusGyr;
  const criticalStress = Pcr * 1000 / (area * 1e-6) / 1e6; // MPa

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 360, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, top = 30, bot = H - 30, amp = 30;
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 4; ctx.beginPath();
    for (let i = 0; i <= 100; i++) { const t = i / 100; const y = top + t * (bot - top); let dx = 0;
      if (ends === "Pinned-pinned") dx = amp * Math.sin(Math.PI * t);
      else if (ends === "Fixed-fixed") dx = amp * (1 - Math.cos(2 * Math.PI * t)) / 2;
      else if (ends === "Fixed-pinned") dx = amp * Math.sin(1.43 * Math.PI * t) * (1 - t * 0.2);
      else dx = amp * (1 - Math.cos(Math.PI * t / 2));
      i ? ctx.lineTo(cx + dx, y) : ctx.moveTo(cx + dx, y); } ctx.stroke();
    ctx.fillStyle = "#e2e8f0"; ctx.fillRect(cx - 30, bot, 60, 8); ctx.fillRect(cx - 30, top - 8, 60, 8);
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.moveTo(cx, top - 24); ctx.lineTo(cx - 5, top - 10); ctx.lineTo(cx + 5, top - 10); ctx.fill(); ctx.font = "11px sans-serif"; ctx.fillText("P", cx + 8, top - 14);
  }, [ends]);

  return (
    <StudioChrome title="Column Buckling (Euler)" tagline="critical load & slenderness"
      controls={<div>
        <Slider label="Young's modulus E (GPa)" value={E} min={10} max={210} step={5} onChange={setE} />
        <Slider label="Moment of inertia I (10⁶ mm⁴)" value={I} min={1} max={100} step={1} onChange={setI} />
        <Slider label="Length L (m)" value={L} min={0.5} max={8} step={0.5} onChange={setL} />
        <Slider label="Cross-section area (mm²)" value={area} min={500} max={10000} step={100} onChange={setArea} />
        <div className="mt-3 grid grid-cols-2 gap-1">{Object.keys(ENDS).map((k) => <button key={k} onClick={() => setEnds(k)} className={`rounded-lg px-1 py-1 text-xs font-semibold ${ends === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{k}</button>)}</div>
        <p className="mt-3 text-xs text-slate-500">A slender column fails not by crushing but by buckling sideways at the Euler critical load Pcr = π²EI/(KL)². The effective-length factor K depends on the end restraints — fixing both ends quadruples the capacity versus pinned. Educational tool, not a substitute for code-based design.</p>
      </div>}
      inspector={<div><Stat label="Critical load Pcr" value={`${Pcr.toFixed(0)} kN`} /><Stat label="Effective length" value={`${Le.toFixed(2)} m`} /><Stat label="Slenderness KL/r" value={slenderness.toFixed(0)} /><Stat label="Critical stress" value={`${criticalStress.toFixed(0)} MPa`} /></div>}
    ><canvas ref={canvasRef} width={360} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
