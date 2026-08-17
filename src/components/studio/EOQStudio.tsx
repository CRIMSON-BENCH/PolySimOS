"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Economic Order Quantity.
export function EOQStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [D, setD] = useState(10000); // annual demand
  const [S, setS] = useState(50); // order cost
  const [Hc, setHc] = useState(2); // holding cost per unit/yr

  const eoq = Math.sqrt(2 * D * S / Hc); const totalCost = (q: number) => (D / q) * S + (q / 2) * Hc;
  const optCost = totalCost(eoq); const orders = D / eoq;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, oy = H - 35, pw = W - 70, ph = H - 55; const qMax = eoq * 3, cMax = totalCost(eoq * 0.15);
    const X = (q: number) => ox + (q / qMax) * pw; const Y = (c: number) => oy - (c / cMax) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const plot = (fn: (q: number) => number, col: string) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 1; i <= pw; i++) { const q = (i / pw) * qMax; const y = Y(fn(q)); i === 1 ? ctx.moveTo(ox + i, y) : ctx.lineTo(ox + i, y); } ctx.stroke(); };
    plot((q) => (D / q) * S, "#f472b6"); plot((q) => (q / 2) * Hc, "#a3e635"); plot(totalCost, "#22d3ee");
    ctx.strokeStyle = "#e2e8f0"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(X(eoq), oy); ctx.lineTo(X(eoq), Y(optCost)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#f9a8d4"; ctx.font = "10px sans-serif"; ctx.fillText("ordering", ox + 6, oy - ph + 14); ctx.fillStyle = "#bef264"; ctx.fillText("holding", ox + 60, oy - ph + 14); ctx.fillStyle = "#67e8f9"; ctx.fillText("total", ox + 116, oy - ph + 14);
    ctx.fillStyle = "#94a3b8"; ctx.fillText("EOQ", X(eoq) - 12, oy + 14); ctx.fillText("order quantity →", ox + pw - 100, oy + 26);
  }, [D, S, Hc, eoq, optCost]);

  return (
    <StudioChrome title="Economic Order Quantity" tagline="the inventory sweet spot"
      controls={<div>
        <Slider label="Annual demand D" value={D} min={500} max={50000} step={500} onChange={setD} />
        <Slider label="Cost per order S ($)" value={S} min={10} max={300} step={10} onChange={setS} />
        <Slider label="Holding cost H ($/unit/yr)" value={Hc} min={0.5} max={10} step={0.5} onChange={setHc} />
        <p className="mt-3 text-xs text-slate-500">Order too often and ordering costs pile up; order too much and holding costs balloon. The Economic Order Quantity, EOQ = √(2DS/H), is the order size that minimizes their sum. At the optimum the ordering and holding costs are exactly equal — the crossing point of the two curves. The foundation of inventory management.</p>
      </div>}
      inspector={<div><Stat label="EOQ" value={`${eoq.toFixed(0)} units`} /><Stat label="Orders / year" value={orders.toFixed(1)} /><Stat label="Min total cost" value={`$${optCost.toFixed(0)}`} /></div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
