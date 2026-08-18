"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 740, H = 440;

const PRESETS: Record<string, { order: number; k: number; temp: number }> = {
  "Slow 1st-order": { order: 1, k: 0.15, temp: 1 },
  "Fast 2nd-order": { order: 2, k: 0.6, temp: 1 },
  "Zero-order (constant)": { order: 0, k: 0.3, temp: 1 },
  "Heated (Arrhenius)": { order: 1, k: 0.2, temp: 1.8 },
};

export function KineticsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [order, setOrder] = useState(1);
  const [{ k, temp }, update] = useShareableNumbers({ k: 0.3, temp: 1 });

  const curve = useMemo(() => {
    const kEff = k * Math.exp(temp - 1); const pts: number[] = []; let A = 1; const dt = 0.05;
    for (let t = 0; t <= 20; t += dt) { pts.push(A); const rate = order === 0 ? kEff : order === 1 ? kEff * A : kEff * A * A; A = Math.max(0, A - rate * dt); }
    return { pts, kEff };
  }, [order, k, temp]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H); const pad = 40;
    const sx = (i: number) => pad + (i / curve.pts.length) * (W - 2 * pad); const sy = (a: number) => H - pad - a * (H - 2 * pad);
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(pad, sy(0)); ctx.lineTo(W - pad, sy(0)); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath(); curve.pts.forEach((a, i) => i ? ctx.lineTo(sx(i), sy(a)) : ctx.moveTo(sx(i), sy(a))); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`[A] vs time · ${order}${order === 1 ? "st" : order === 2 ? "nd" : "th"}-order`, pad, 22); ctx.fillText("time →", W - 90, H - 14);
  }, [curve, order]);

  const explain =
    order === 0
      ? `Zero-order: [A] falls in a straight line at a fixed rate (k_eff ≈ ${curve.kEff.toFixed(2)}) until the reactant runs out — the rate ignores how much is left.`
      : order === 1
      ? `First-order: [A] decays exponentially with a constant half-life; raising temperature lifts k_eff to ${curve.kEff.toFixed(2)}, steepening the curve Arrhenius-style.`
      : `Second-order: rate scales with [A]², so it starts fast then crawls into a long tail — doubling concentration quadruples the initial rate.`;

  const code = `import numpy as np
order, k, temp = ${order}, ${k}, ${temp}
k_eff = k*np.exp(temp-1); A, dt = 1.0, 0.05
ts, As, t = [], [], 0.0
while t <= 20:
    ts.append(t); As.append(A)
    rate = k_eff if order==0 else k_eff*A if order==1 else k_eff*A*A
    A = max(0.0, A - rate*dt); t += dt
print("final [A]", A, "k_eff", k_eff)`;

  return (
    <StudioChrome title="Reaction Kinetics" tagline="rate laws · Arrhenius temperature"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => { const pr = PRESETS[label]; setOrder(pr.order); update({ k: pr.k, temp: pr.temp }); }}
        />
        <div className="mb-3 flex gap-2">{[0, 1, 2].map((o) => <button key={o} onClick={() => setOrder(o)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold ${order === o ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{o}-order</button>)}</div>
        <p className="mb-3 text-xs text-slate-500">Watch reactant concentration fall over time. The reaction order sets the curve shape; raising temperature speeds the rate constant, Arrhenius-style.</p>
        <Slider label="Rate constant k" value={k} min={0.05} max={1} step={0.05} onChange={(v) => update({ k: v })} />
        <Slider label="Temperature factor" value={temp} min={0.5} max={2} step={0.1} onChange={(v) => update({ temp: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Order" value={String(order)} /><Stat label="Effective k" value={curve.kEff.toFixed(3)} /><Stat label="Arrhenius" value="k = A·e^(−Ea/RT)" /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
