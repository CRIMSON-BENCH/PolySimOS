"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Semi-empirical mass formula: binding energy per nucleon.
function bePerA(A: number): number {
  if (A < 2) return 0; const Z = Math.round(A / (1.98 + 0.015 * Math.pow(A, 2 / 3)));
  const aV = 15.8, aS = 18.3, aC = 0.714, aA = 23.2; let d = 0; const even = (n: number) => n % 2 === 0;
  if (even(Z) && even(A - Z)) d = 12 / Math.sqrt(A); else if (!even(Z) && !even(A - Z)) d = -12 / Math.sqrt(A);
  const BE = aV * A - aS * Math.pow(A, 2 / 3) - aC * Z * (Z - 1) / Math.pow(A, 1 / 3) - aA * (A - 2 * Z) ** 2 / A + d;
  return BE / A;
}

export function BindingEnergyStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [massNum, setMassNum] = useState(56);
  const be = bePerA(massNum);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const aMax = 250;
    const X = (a: number) => ox + (a / aMax) * pw; const Y = (v: number) => oy - (v / 9.5) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let a = 2; a <= aMax; a++) { const y = Y(bePerA(a)); a === 2 ? ctx.moveTo(X(a), y) : ctx.lineTo(X(a), y); } ctx.stroke();
    // iron peak
    ctx.strokeStyle = "#a3e635"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(56), oy); ctx.lineTo(X(56), Y(bePerA(56))); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(X(massNum), Y(be), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("binding energy per nucleon (MeV)", ox + 6, oy - ph + 12); ctx.fillStyle = "#bef264"; ctx.fillText("Fe-56 peak", X(56) - 20, Y(bePerA(56)) - 8); ctx.fillStyle = "#94a3b8"; ctx.fillText("mass number A →", ox + pw - 110, oy + 16);
  }, [massNum]);

  const process = massNum < 56 ? "fusion releases energy" : "fission releases energy";
  return (
    <StudioChrome title="Nuclear Binding Energy" tagline="why stars shine and bombs work"
      controls={<div>
        <Slider label="Mass number A" value={massNum} min={2} max={240} step={1} onChange={setMassNum} />
        <div className="mt-3 flex flex-wrap gap-1">{[["He-4", 4], ["Fe-56", 56], ["U-235", 235]].map(([n, a]) => <button key={n as string} onClick={() => setMassNum(a as number)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-400">{n}</button>)}</div>
        <p className="mt-3 text-xs text-slate-500">The binding energy per nucleon measures how tightly a nucleus is held together, peaking at iron-56. Light nuclei release energy by fusing toward that peak — the power source of stars; heavy nuclei release energy by splitting toward it — the basis of fission reactors and bombs. Iron is the ash where both paths end.</p>
      </div>}
      inspector={<div><Stat label="BE per nucleon" value={`${be.toFixed(2)} MeV`} /><Stat label="Total BE" value={`${(be * massNum).toFixed(0)} MeV`} /><Stat label="Energy path" value={process} /></div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
