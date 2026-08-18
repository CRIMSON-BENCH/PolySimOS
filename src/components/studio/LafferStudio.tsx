"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { elasticity: number; rate: number }> = {
  "Inelastic base": { elasticity: 0.8, rate: 0.55 },
  "Very elastic": { elasticity: 3.5, rate: 0.35 },
  "Textbook (e=1.5)": { elasticity: 1.5, rate: 0.5 },
  "Over-taxed": { elasticity: 2, rate: 0.9 },
};

// Laffer curve: revenue = rate * base(rate), base falls as rate rises.
export function LafferStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ elasticity, rate }, update] = useShareableNumbers({ elasticity: 1.5, rate: 0.35 });

  const base = (t: number) => Math.max(0, 1 - Math.pow(t, elasticity)); // shrinks with rate
  const revenue = (t: number) => t * base(t);
  // find peak
  let peakT = 0, peakR = 0; for (let t = 0; t <= 1; t += 0.005) { const r = revenue(t); if (r > peakR) { peakR = r; peakT = t; } }

  useEffect(() => {
    const W = 500, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    const X = (t: number) => ox + t * pw; const Y = (r: number) => oy - (r / (peakR * 1.1)) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 200; i++) { const t = i / 200; const y = Y(revenue(t)); i ? ctx.lineTo(X(t), y) : ctx.moveTo(X(t), y); } ctx.stroke();
    // peak
    ctx.strokeStyle = "#a3e635"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(peakT), oy); ctx.lineTo(X(peakT), Y(peakR)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(X(rate), Y(revenue(rate)), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("tax revenue vs tax rate", ox + 6, oy - ph + 14); ctx.fillStyle = "#bef264"; ctx.fillText(`revenue-max ≈ ${(peakT * 100).toFixed(0)}%`, X(peakT) - 40, oy - ph + 30); ctx.fillStyle = "#94a3b8"; ctx.fillText("tax rate →", ox + pw - 60, oy + 16);
  }, [elasticity, rate]);

  const pk = (peakT * 100).toFixed(0);
  const explain =
    rate > peakT + 0.02
      ? `Past the revenue peak (≈${pk}%) — a higher rate now shrinks the taxable base faster than the rate rises, so cutting taxes would actually raise more revenue.`
      : rate < peakT - 0.02
      ? `Below the revenue-maximizing rate (≈${pk}%) — the base is still large, so a modest rate increase collects more.`
      : `Right at the peak (≈${pk}%) — revenue is maxed for this behavioral response, and moving the rate either direction loses money.`;

  const code = `import numpy as np
elasticity, rate = ${elasticity}, ${rate}
base = lambda t: max(0.0, 1 - t**elasticity)
revenue = lambda t: t*base(t)
ts = np.linspace(0, 1, 201)
peak = ts[int(np.argmax([revenue(t) for t in ts]))]
print("revenue", revenue(rate), "peak rate", peak)`;

  return (
    <StudioChrome title="Laffer Curve" tagline="tax rate vs revenue"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Behavioral response" value={elasticity} min={0.5} max={4} step={0.1} onChange={(v) => update({ elasticity: v })} />
        <Slider label="Tax rate" value={rate} min={0} max={0.95} step={0.01} onChange={(v) => update({ rate: v })} />
        <p className="mt-3 text-xs text-slate-500">At a 0% tax rate the government collects nothing; at 100% no one bothers to earn taxable income, so it also collects nothing. Somewhere between lies a revenue-maximizing rate — the peak of the Laffer curve. How responsive people are to taxes (the elasticity) sets where that peak falls. It is descriptive, not a policy prescription.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Revenue at rate" value={revenue(rate).toFixed(3)} /><Stat label="Revenue-max rate" value={`${pk}%`} /><Stat label="Zone" value={rate > peakT ? "above peak" : "below peak"} /><Equation tex={`R(t)=t\\,B(t)=t\\left(1-t^{${elasticity}}\\right),\\quad \\left.\\frac{dR}{dt}\\right|_{t^{*}}=0,\\quad t=${rate.toFixed(2)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
