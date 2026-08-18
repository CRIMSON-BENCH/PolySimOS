"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const ENDS: Record<string, { K: number; label: string }> = {
  "Pinned-pinned": { K: 1.0, label: "both ends pinned" },
  "Fixed-fixed": { K: 0.5, label: "both ends fixed" },
  "Fixed-pinned": { K: 0.7, label: "one fixed, one pinned" },
  "Fixed-free": { K: 2.0, label: "cantilever column" },
};

const PRESETS: Record<string, { E: number; I: number; L: number; area: number }> = {
  "Steel strut": { E: 200, I: 10, L: 3, area: 3000 },
  "Aluminum long": { E: 70, I: 20, L: 6, area: 4000 },
  "Stocky steel": { E: 200, I: 80, L: 1, area: 8000 },
  "Slender rod": { E: 200, I: 2, L: 8, area: 1000 },
};

export function ColumnBucklingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ E, I, L, area }, update] = useShareableNumbers({ E: 200, I: 10, L: 3, area: 3000 }); // GPa, 10^6 mm^4, m, mm^2
  const [ends, setEnds] = useState("Pinned-pinned");

  const K = ENDS[ends].K; const Le = K * L;
  const Pcr = (Math.PI ** 2 * (E * 1e9) * (I * 1e-6)) / (Le ** 2) / 1000; // kN
  const radiusGyr = Math.sqrt((I * 1e-6) / (area * 1e-6)) * 1000; // mm... I in m^4, A in m^2 -> m, *1000 mm
  const slenderness = (Le * 1000) / radiusGyr;
  const criticalStress = Pcr * 1000 / (area * 1e-6) / 1e6; // MPa

  useEffect(() => {
    const W = 360, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
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

  const explain =
    slenderness > 120
      ? `At slenderness KL/r = ${slenderness.toFixed(0)} this is a long, slender column: it buckles elastically at about ${Pcr.toFixed(0)} kN long before the material yields.`
      : slenderness < 50
      ? `At slenderness KL/r = ${slenderness.toFixed(0)} the column is stocky — crushing/yielding governs, so the Euler load of ${Pcr.toFixed(0)} kN overpredicts the real capacity.`
      : `Intermediate slenderness (KL/r = ${slenderness.toFixed(0)}): buckling and yielding compete, so design codes blend the two rather than trusting Euler alone.`;

  const code = `import numpy as np
E, I, L, area = ${E}, ${I}, ${L}, ${area}   # GPa, 1e6 mm^4, m, mm^2
K = ${K}                                     # ${ENDS[ends].label}
Le = K * L
Pcr = np.pi**2 * (E*1e9) * (I*1e-6) / Le**2 / 1000       # kN
r = np.sqrt((I*1e-6) / (area*1e-6)) * 1000               # radius of gyration, mm
slenderness = (Le*1000) / r
print("Pcr kN", Pcr, "KL/r", slenderness)`;

  return (
    <StudioChrome title="Column Buckling (Euler)" tagline="critical load & slenderness"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Young's modulus E (GPa)" value={E} min={10} max={210} step={5} onChange={(v) => update({ E: v })} />
        <Slider label="Moment of inertia I (10⁶ mm⁴)" value={I} min={1} max={100} step={1} onChange={(v) => update({ I: v })} />
        <Slider label="Length L (m)" value={L} min={0.5} max={8} step={0.5} onChange={(v) => update({ L: v })} />
        <Slider label="Cross-section area (mm²)" value={area} min={500} max={10000} step={100} onChange={(v) => update({ area: v })} />
        <div className="mt-3 grid grid-cols-2 gap-1">{Object.keys(ENDS).map((k) => <button key={k} onClick={() => setEnds(k)} className={`rounded-lg px-1 py-1 text-xs font-semibold ${ends === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{k}</button>)}</div>
        <p className="mt-3 text-xs text-slate-500">A slender column fails not by crushing but by buckling sideways at the Euler critical load Pcr = π²EI/(KL)². The effective-length factor K depends on the end restraints — fixing both ends quadruples the capacity versus pinned. Educational tool, not a substitute for code-based design.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Critical load Pcr" value={`${Pcr.toFixed(0)} kN`} /><Stat label="Effective length" value={`${Le.toFixed(2)} m`} /><Stat label="Slenderness KL/r" value={slenderness.toFixed(0)} /><Stat label="Critical stress" value={`${criticalStress.toFixed(0)} MPa`} /><Equation tex={`P_{cr}=\\dfrac{\\pi^2 E I}{(KL)^2}=\\dfrac{\\pi^2 (${E}\\,\\text{GPa})(${I}\\times10^6\\,\\text{mm}^4)}{(${K}\\times${L}\\,\\text{m})^2}=${Pcr.toFixed(0)}\\,\\text{kN}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={360} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
