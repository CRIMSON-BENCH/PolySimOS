"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { L: number; P: number; a: number; w: number }> = {
  "Central load": { L: 6, P: 40, a: 3, w: 0 },
  "Uniform load": { L: 8, P: 0, a: 4, w: 10 },
  "Off-center P": { L: 6, P: 30, a: 1.5, w: 3 },
  "Heavy combined": { L: 10, P: 60, a: 5, w: 15 },
};

// Simply-supported beam with a point load at position a and a uniform load.
export function ShearMomentStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ L, P, a, w }, update] = useShareableNumbers({ L: 6, P: 20, a: 2, w: 5 });

  // reactions
  const Wt = w * L; const RB = (P * a + Wt * L / 2) / L; const RA = P + Wt - RB;
  const shear = (x: number) => RA - w * x - (x >= a ? P : 0);
  const moment = (x: number) => RA * x - w * x * x / 2 - (x >= a ? P * (x - a) : 0);
  let mMax = 0, xMax = 0; for (let x = 0; x <= L; x += L / 400) { if (moment(x) > mMax) { mMax = moment(x); xMax = x; } }
  const vMax = Math.max(Math.abs(RA), Math.abs(RB), Math.abs(shear(a) ), Math.abs(shear(Math.min(a + 0.001, L))));

  const explain =
    P === 0
      ? `Pure uniform load: the moment is a smooth parabola peaking at midspan, Mmax ${mMax.toFixed(1)} kN·m, with no sudden jumps in the shear line.`
      : w === 0
      ? `A single ${P} kN load at x=${a} m makes shear constant on each side and jump under the load, where the moment peaks at ${mMax.toFixed(1)} kN·m.`
      : `Combined loading: reactions RA=${RA.toFixed(1)} and RB=${RB.toFixed(1)} kN, and the maximum moment ${mMax.toFixed(1)} kN·m lands at x=${xMax.toFixed(1)} m where shear crosses zero.`;

  const code = `import numpy as np
L, P, a, w = ${L}, ${P}, ${a}, ${w}
Wt = w * L; RB = (P * a + Wt * L / 2) / L; RA = P + Wt - RB
x = np.linspace(0, L, 401)
shear = RA - w * x - np.where(x >= a, P, 0)
moment = RA * x - w * x**2 / 2 - np.where(x >= a, P * (x - a), 0)
print("RA", RA, "RB", RB, "Mmax", moment.max(), "at x", x[moment.argmax()])`;

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
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Span L (m)" value={L} min={2} max={12} step={0.5} onChange={(v) => update({ L: v })} />
        <Slider label="Point load P (kN)" value={P} min={0} max={80} step={5} onChange={(v) => update({ P: v })} />
        <Slider label="Load position a (m)" value={a} min={0} max={L} step={0.25} onChange={(v) => update({ a: v })} />
        <Slider label="Uniform load w (kN/m)" value={w} min={0} max={20} step={1} onChange={(v) => update({ w: v })} />
        <p className="mt-3 text-xs text-slate-500">Shear and bending-moment diagrams show the internal forces along a beam. Shear jumps at each point load; the moment is the running integral of shear and peaks where shear crosses zero. Engineers size beams for this maximum moment. Educational tool, not a substitute for structural design.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Reaction A" value={`${RA.toFixed(1)} kN`} /><Stat label="Reaction B" value={`${RB.toFixed(1)} kN`} /><Stat label="Max moment" value={`${mMax.toFixed(1)} kN·m`} /><Stat label="at x" value={`${xMax.toFixed(2)} m`} /><Equation tex={`\\frac{dV}{dx}=-w=-${w},\\quad \\frac{dM}{dx}=V,\\quad M_{\\max}=${mMax.toFixed(1)}\\;\\text{kN·m}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
