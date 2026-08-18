"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function BootstrapStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sampleSize, setSampleSize] = useState(25);
  const [B, setB] = useState(2000);
  const [seed, setSeed] = useState(1);
  const [ci, setCi] = useState({ lo: 0, hi: 0, mean: 0 });

  useEffect(() => {
    let s = seed * 6151 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    // original sample from a skewed distribution
    const N = Math.round(sampleSize); const data: number[] = []; for (let i = 0; i < N; i++) data.push(-Math.log(1 - rnd()) * 20 + 10);
    const origMean = data.reduce((a, b) => a + b, 0) / N;
    const boots: number[] = []; for (let b = 0; b < B; b++) { let sum = 0; for (let i = 0; i < N; i++) sum += data[(rnd() * N) | 0]; boots.push(sum / N); }
    boots.sort((a, b) => a - b); const lo = boots[(B * 0.025) | 0], hi = boots[(B * 0.975) | 0]; setCi({ lo, hi, mean: origMean });
    const W = 540, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 30, oy = H - 30, pw = W - 60, ph = H - 55; const mn = boots[0], mx = boots[B - 1];
    const bins = 45; const hist = new Array(bins).fill(0); boots.forEach((v) => { const bi = Math.min(bins - 1, ((v - mn) / (mx - mn) * bins) | 0); hist[bi]++; });
    const hmax = Math.max(...hist); const X = (v: number) => ox + ((v - mn) / (mx - mn)) * pw;
    for (let bi = 0; bi < bins; bi++) { const x = ox + (bi / bins) * pw; const bh = (hist[bi] / hmax) * ph; const v = mn + (bi / bins) * (mx - mn); ctx.fillStyle = v >= lo && v <= hi ? "#22d3ee" : "#334155"; ctx.fillRect(x, oy - bh, pw / bins - 1, bh); }
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; [lo, hi].forEach((v) => { ctx.beginPath(); ctx.moveTo(X(v), oy); ctx.lineTo(X(v), oy - ph); ctx.stroke(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("bootstrap distribution of the mean", ox + 6, 16); ctx.fillStyle = "#f9a8d4"; ctx.fillText("95% CI", X(hi) + 4, oy - ph + 12);
  }, [sampleSize, B, seed]);

  return (
    <StudioChrome title="Bootstrap Resampling" tagline="confidence without formulas"
      controls={<div>
        <Slider label="Original sample size" value={sampleSize} min={5} max={100} step={5} onChange={setSampleSize} />
        <Slider label="Bootstrap resamples B" value={B} min={200} max={5000} step={200} onChange={setB} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">New original sample</button>
        <p className="mt-3 text-xs text-slate-500">The bootstrap estimates uncertainty by resampling your data with replacement thousands of times and recomputing the statistic each time. The spread of those bootstrap means gives a confidence interval — no formula or normality assumption required. Powerful when the math is intractable.</p>
      </div>}
      inspector={<div><Stat label="Sample mean" value={ci.mean.toFixed(2)} /><Stat label="95% CI low" value={ci.lo.toFixed(2)} /><Stat label="95% CI high" value={ci.hi.toFixed(2)} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
