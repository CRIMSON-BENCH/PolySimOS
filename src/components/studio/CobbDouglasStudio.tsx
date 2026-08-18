"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Cobb-Douglas production Q = A K^a L^(1-a); isoquants + cost-min.
export function CobbDouglasStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [alpha, setAlpha] = useState(0.5);
  const [budget, setBudget] = useState(100);
  const [r, setR] = useState(4); // rental of K
  const [w, setW] = useState(3); // wage of L

  // cost-min: K = alpha/r * C/(alpha/r ... ) ; optimal K = alpha*C/r, L=(1-alpha)*C/w
  const K = alpha * budget / r, L = (1 - alpha) * budget / w; const A = 1; const Q = A * Math.pow(K, alpha) * Math.pow(L, 1 - alpha);

  useEffect(() => {
    const W = 460, H = 360; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const kMax = budget / r * 1.3, lMax = budget / w * 1.3;
    const X = (l: number) => ox + (l / lMax) * pw; const Y = (k: number) => oy - (k / kMax) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // isoquants for a few output levels
    [Q * 0.6, Q, Q * 1.4].forEach((qq, i) => { ctx.strokeStyle = i === 1 ? "#22d3ee" : "#1e3a5f"; ctx.lineWidth = i === 1 ? 2 : 1.2; ctx.beginPath(); let started = false; for (let l = 0.5; l < lMax; l += 0.3) { const k = Math.pow(qq / (A * Math.pow(l, 1 - alpha)), 1 / alpha); if (k > 0 && k < kMax) { started ? ctx.lineTo(X(l), Y(k)) : ctx.moveTo(X(l), Y(k)); started = true; } } ctx.stroke(); });
    // budget line: rK + wL = C
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(0), Y(budget / r)); ctx.lineTo(X(budget / w), Y(0)); ctx.stroke();
    ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(X(L), Y(K), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("isoquants (cyan) + budget line (pink)", ox + 6, oy - ph + 14); ctx.fillText("labor L →", ox + pw - 60, oy + 16); ctx.save(); ctx.translate(16, oy - ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("capital K", -30, 0); ctx.restore();
  }, [alpha, budget, r, w]);

  return (
    <StudioChrome title="Cobb-Douglas Production" tagline="optimal input mix"
      controls={<div>
        <Slider label="Capital share α" value={alpha} min={0.1} max={0.9} step={0.05} onChange={setAlpha} />
        <Slider label="Budget" value={budget} min={40} max={300} step={10} onChange={setBudget} />
        <Slider label="Capital rental r" value={r} min={1} max={10} step={0.5} onChange={setR} />
        <Slider label="Wage w" value={w} min={1} max={10} step={0.5} onChange={setW} />
        <p className="mt-3 text-xs text-slate-500">The Cobb-Douglas function Q = A·Kᵅ·L¹⁻ᵅ describes how capital and labor combine to make output. Isoquants show input mixes yielding the same output; the budget line shows what you can afford. Production is maximized where the budget line just touches the highest isoquant — the cost-minimizing input mix, splitting spending by the exponents.</p>
      </div>}
      inspector={<div><Stat label="Optimal capital K" value={K.toFixed(1)} /><Stat label="Optimal labor L" value={L.toFixed(1)} /><Stat label="Output Q" value={Q.toFixed(1)} /></div>}
    ><canvas ref={canvasRef} width={460} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
