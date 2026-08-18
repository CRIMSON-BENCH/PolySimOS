"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Laffer curve: revenue = rate * base(rate), base falls as rate rises.
export function LafferStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elasticity, setElasticity] = useState(1.5);
  const [rate, setRate] = useState(0.35);

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

  return (
    <StudioChrome title="Laffer Curve" tagline="tax rate vs revenue"
      controls={<div>
        <Slider label="Behavioral response" value={elasticity} min={0.5} max={4} step={0.1} onChange={setElasticity} />
        <Slider label="Tax rate" value={rate} min={0} max={0.95} step={0.01} onChange={setRate} />
        <p className="mt-3 text-xs text-slate-500">At a 0% tax rate the government collects nothing; at 100% no one bothers to earn taxable income, so it also collects nothing. Somewhere between lies a revenue-maximizing rate — the peak of the Laffer curve. How responsive people are to taxes (the elasticity) sets where that peak falls. It is descriptive, not a policy prescription.</p>
      </div>}
      inspector={<div><Stat label="Revenue at rate" value={revenue(rate).toFixed(3)} /><Stat label="Revenue-max rate" value={`${(peakT * 100).toFixed(0)}%`} /><Stat label="Zone" value={rate > peakT ? "above peak" : "below peak"} /></div>}
    ><canvas ref={canvasRef} width={500} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
