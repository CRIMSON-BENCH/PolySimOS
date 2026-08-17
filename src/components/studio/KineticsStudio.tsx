"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 740, H = 440;

export function KineticsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [order, setOrder] = useState(1);
  const [k, setK] = useState(0.3);
  const [temp, setTemp] = useState(1);

  const curve = useMemo(() => {
    const kEff = k * Math.exp(temp - 1); const pts: number[] = []; let A = 1; const dt = 0.05;
    for (let t = 0; t <= 20; t += dt) { pts.push(A); const rate = order === 0 ? kEff : order === 1 ? kEff * A : kEff * A * A; A = Math.max(0, A - rate * dt); }
    return { pts, kEff };
  }, [order, k, temp]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H); const pad = 40;
    const sx = (i: number) => pad + (i / curve.pts.length) * (W - 2 * pad); const sy = (a: number) => H - pad - a * (H - 2 * pad);
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(pad, sy(0)); ctx.lineTo(W - pad, sy(0)); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath(); curve.pts.forEach((a, i) => i ? ctx.lineTo(sx(i), sy(a)) : ctx.moveTo(sx(i), sy(a))); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`[A] vs time · ${order}${order === 1 ? "st" : order === 2 ? "nd" : "th"}-order`, pad, 22); ctx.fillText("time →", W - 90, H - 14);
  }, [curve, order]);

  return (
    <StudioChrome title="Reaction Kinetics" tagline="rate laws · Arrhenius temperature"
      controls={<div>
        <div className="mb-3 flex gap-2">{[0, 1, 2].map((o) => <button key={o} onClick={() => setOrder(o)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold ${order === o ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{o}-order</button>)}</div>
        <p className="mb-3 text-xs text-slate-500">Watch reactant concentration fall over time. The reaction order sets the curve shape; raising temperature speeds the rate constant, Arrhenius-style.</p>
        <Slider label="Rate constant k" value={k} min={0.05} max={1} step={0.05} onChange={setK} />
        <Slider label="Temperature factor" value={temp} min={0.5} max={2} step={0.1} onChange={setTemp} />
      </div>}
      inspector={<div><Stat label="Order" value={String(order)} /><Stat label="Effective k" value={curve.kEff.toFixed(3)} /><Stat label="Arrhenius" value="k = A·e^(−Ea/RT)" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
