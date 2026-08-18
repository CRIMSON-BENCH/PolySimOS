"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Simply-supported beam with a point load at position a and a uniform load.
export function ShearMomentStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [L, setL] = useState(6);
  const [P, setP] = useState(20); // kN point load
  const [a, setA] = useState(2); // position of P
  const [w, setW] = useState(5); // kN/m UDL

  // reactions
  const Wt = w * L; const RB = (P * a + Wt * L / 2) / L; const RA = P + Wt - RB;
  const shear = (x: number) => RA - w * x - (x >= a ? P : 0);
  const moment = (x: number) => RA * x - w * x * x / 2 - (x >= a ? P * (x - a) : 0);
  let mMax = 0, xMax = 0; for (let x = 0; x <= L; x += L / 400) { if (moment(x) > mMax) { mMax = moment(x); xMax = x; } }
  const vMax = Math.max(Math.abs(RA), Math.abs(RB), Math.abs(shear(a) ), Math.abs(shear(Math.min(a + 0.001, L))));

  useEffect(() => {
    const W = 540, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, span = W - 80;
    const drawAxis = (y0: number, label: string) => { ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, y0); ctx.lineTo(ox + span, y0); ctx.stroke(); ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(label, ox, y0 - 44); };
    // shear diagram
    const yS = 100; drawAxis(yS, "shear force (kN)"); ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 400; i++) { const x = (i / 400) * L; const v = shear(Math.min(x, L - 1e-6)); const px = ox + (x / L) * span, py = yS - (v / vMax) * 38; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
    // moment diagram
    const yM = 250; drawAxis(yM, "bending moment (kN·m)"); ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 400; i++) { const x = (i / 400) * L; const py = yM - (moment(x) / mMax) * 60; const px = ox + (x / L) * span; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
    ctx.fillStyle = "#f9a8d4"; ctx.fillText(`Mmax ${mMax.toFixed(1)} at x=${xMax.toFixed(1)}m`, ox + span - 150, yM + 20);
  }, [L, P, a, w]);

  return (
    <StudioChrome title="Shear & Moment Diagrams" tagline="simply-supported beam"
      controls={<div>
        <Slider label="Span L (m)" value={L} min={2} max={12} step={0.5} onChange={setL} />
        <Slider label="Point load P (kN)" value={P} min={0} max={80} step={5} onChange={setP} />
        <Slider label="Load position a (m)" value={a} min={0} max={L} step={0.25} onChange={setA} />
        <Slider label="Uniform load w (kN/m)" value={w} min={0} max={20} step={1} onChange={setW} />
        <p className="mt-3 text-xs text-slate-500">Shear and bending-moment diagrams show the internal forces along a beam. Shear jumps at each point load; the moment is the running integral of shear and peaks where shear crosses zero. Engineers size beams for this maximum moment. Educational tool, not a substitute for structural design.</p>
      </div>}
      inspector={<div><Stat label="Reaction A" value={`${RA.toFixed(1)} kN`} /><Stat label="Reaction B" value={`${RB.toFixed(1)} kN`} /><Stat label="Max moment" value={`${mMax.toFixed(1)} kN·m`} /><Stat label="at x" value={`${xMax.toFixed(2)} m`} /></div>}
    ><canvas ref={canvasRef} width={540} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
