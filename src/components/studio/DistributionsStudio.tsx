"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 760, H = 480;

export function DistributionsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dist, setDist] = useState<"normal" | "exponential" | "poisson" | "binomial">("normal");
  const [p1, setP1] = useState(0);
  const [p2, setP2] = useState(1);

  const { xs, ys, mean, variance, discrete } = useMemo(() => {
    const xs: number[] = [], ys: number[] = [];
    let mean = 0, variance = 0, discrete = false;
    if (dist === "normal") { const mu = p1, sig = Math.max(0.1, p2); for (let i = 0; i <= 200; i++) { const x = mu - 5 * sig + (10 * sig * i) / 200; xs.push(x); ys.push(Math.exp(-((x - mu) ** 2) / (2 * sig * sig)) / (sig * Math.sqrt(2 * Math.PI))); } mean = mu; variance = sig * sig; }
    else if (dist === "exponential") { const lam = Math.max(0.1, p2); for (let i = 0; i <= 200; i++) { const x = (10 / lam) * (i / 200); xs.push(x); ys.push(lam * Math.exp(-lam * x)); } mean = 1 / lam; variance = 1 / (lam * lam); }
    else if (dist === "poisson") { discrete = true; const lam = Math.max(0.1, p2 * 3); let f = 1; for (let k = 0; k <= 20; k++) { if (k > 0) f *= k; xs.push(k); ys.push(Math.exp(-lam) * Math.pow(lam, k) / f); } mean = lam; variance = lam; }
    else { discrete = true; const nT = 20, pp = Math.min(0.99, Math.max(0.01, (p2) / 4)); const ch = (n: number, k: number) => { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return r; }; for (let k = 0; k <= nT; k++) { xs.push(k); ys.push(ch(nT, k) * Math.pow(pp, k) * Math.pow(1 - pp, nT - k)); } mean = nT * pp; variance = nT * pp * (1 - pp); }
    return { xs, ys, mean, variance, discrete };
  }, [dist, p1, p2]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const pad = 40; const maxY = Math.max(...ys, 0.01); const minX = xs[0], maxX = xs[xs.length - 1];
    const sx = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (W - 2 * pad); const sy = (y: number) => H - pad - (y / maxY) * (H - 2 * pad);
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke();
    if (discrete) { const bw = (W - 2 * pad) / xs.length * 0.7; xs.forEach((x, i) => { ctx.fillStyle = "#22d3ee"; const h = (ys[i] / maxY) * (H - 2 * pad); ctx.fillRect(sx(x) - bw / 2, H - pad - h, bw, h); }); }
    else { ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath(); xs.forEach((x, i) => i ? ctx.lineTo(sx(x), sy(ys[i])) : ctx.moveTo(sx(x), sy(ys[i]))); ctx.stroke(); ctx.lineTo(sx(maxX), H - pad); ctx.lineTo(sx(minX), H - pad); ctx.closePath(); ctx.fillStyle = "rgba(34,211,238,0.15)"; ctx.fill(); }
  }, [xs, ys, discrete]);

  return (
    <StudioChrome title="Probability Distributions" tagline="PDF / PMF explorer"
      controls={<div>
        <div className="mb-3 grid grid-cols-2 gap-1.5">{(["normal", "exponential", "poisson", "binomial"] as const).map((d) => <button key={d} onClick={() => setDist(d)} className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${dist === d ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{d}</button>)}</div>
        {dist === "normal" && <Slider label="Mean μ" value={p1} min={-5} max={5} step={0.5} onChange={setP1} />}
        <Slider label={dist === "normal" ? "Std dev σ" : dist === "exponential" ? "Rate λ" : dist === "poisson" ? "λ (×3)" : "p (×4)"} value={p2} min={0.2} max={4} step={0.1} onChange={setP2} />
      </div>}
      inspector={<div><Stat label="Distribution" value={dist} /><Stat label="Mean" value={mean.toFixed(3)} /><Stat label="Variance" value={variance.toFixed(3)} /><Stat label="Std dev" value={Math.sqrt(variance).toFixed(3)} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
