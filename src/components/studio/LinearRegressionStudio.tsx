"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { slope: number; noise: number; nPts: number }> = {
  "Clean trend": { slope: 2, noise: 0.5, nPts: 80 },
  "Noisy": { slope: 1.5, noise: 6, nPts: 40 },
  "Sparse data": { slope: 2, noise: 3, nPts: 10 },
  "No signal": { slope: 0, noise: 4, nPts: 60 },
};

export function LinearRegressionStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ slope, noise, nPts }, update] = useShareableNumbers({ slope: 1.5, noise: 2, nPts: 40 });
  const [seed, setSeed] = useState(1);
  const [fit, setFit] = useState({ m: 0, b: 0, r2: 0 });

  useEffect(() => {
    let s = seed * 8123 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const N = Math.round(nPts); const pts: [number, number][] = [];
    for (let i = 0; i < N; i++) { const x = rnd() * 10; const y = slope * x + 2 + gauss() * noise; pts.push([x, y]); }
    const mx = pts.reduce((a, p) => a + p[0], 0) / N, my = pts.reduce((a, p) => a + p[1], 0) / N;
    let sxy = 0, sxx = 0, syy = 0; for (const [x, y] of pts) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
    const m = sxy / sxx, b = my - m * mx; const r2 = (sxy * sxy) / (sxx * syy); setFit({ m, b, r2 });
    const W = 500, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 30, pw = W - 60, ph = H - 50; const yMax = Math.max(...pts.map((p) => p[1]), 5) * 1.1, yMin = Math.min(...pts.map((p) => p[1]), 0);
    const X = (x: number) => ox + (x / 10) * pw; const Y = (y: number) => oy - ((y - yMin) / (yMax - yMin)) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // residuals
    ctx.strokeStyle = "rgba(148,163,184,0.4)"; for (const [x, y] of pts) { ctx.beginPath(); ctx.moveTo(X(x), Y(y)); ctx.lineTo(X(x), Y(m * x + b)); ctx.stroke(); }
    // points
    for (const [x, y] of pts) { ctx.beginPath(); ctx.arc(X(x), Y(y), 3.5, 0, 7); ctx.fillStyle = "#f472b6"; ctx.fill(); }
    // fit line
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(X(0), Y(b)); ctx.lineTo(X(10), Y(m * 10 + b)); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`ŷ = ${m.toFixed(2)}x + ${b.toFixed(2)}`, ox + 8, oy - ph + 12);
  }, [slope, noise, nPts, seed]);

  const explain =
    fit.r2 >= 0.9
      ? `R² = ${fit.r2.toFixed(2)}: the line explains almost all the variance because the noise (${noise}) is small next to the ${slope.toFixed(1)} slope — the signal dominates the scatter.`
      : fit.r2 >= 0.5
      ? `R² = ${fit.r2.toFixed(2)}: the trend is real, but noise (${noise}) scatters the points, so the fitted slope ${fit.m.toFixed(2)} only loosely tracks the true ${slope.toFixed(1)}.`
      : `R² = ${fit.r2.toFixed(2)}: noise (${noise}) swamps the signal, so least squares can barely tell the slope from flat — adding data points would tighten the estimate.`;

  const code = `import numpy as np
rng = np.random.default_rng(${seed})
slope, noise, n = ${slope}, ${noise}, ${Math.round(nPts)}
x = rng.random(n) * 10
y = slope * x + 2 + rng.standard_normal(n) * noise
m, b = np.polyfit(x, y, 1)
r = np.corrcoef(x, y)[0, 1]
print("slope", m, "intercept", b, "R2", r ** 2)`;

  return (
    <StudioChrome title="Linear Regression" tagline="least squares & R²"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="True slope" value={slope} min={-3} max={3} step={0.1} onChange={(v) => update({ slope: v })} />
        <Slider label="Noise level" value={noise} min={0} max={8} step={0.5} onChange={(v) => update({ noise: v })} />
        <Slider label="Data points" value={nPts} min={5} max={150} step={5} onChange={(v) => update({ nPts: v })} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">New sample</button>
        <p className="mt-3 text-xs text-slate-500">Ordinary least squares finds the line that minimizes the sum of squared vertical residuals (the gray drop-lines). R² measures the fraction of variance the line explains — 1 is perfect, 0 is useless. Add noise or remove points to watch the fit and R² degrade.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Fitted slope" value={fit.m.toFixed(3)} /><Stat label="Intercept" value={fit.b.toFixed(3)} /><Stat label="R²" value={fit.r2.toFixed(3)} /><Stat label="Correlation r" value={(Math.sign(fit.m) * Math.sqrt(Math.max(0, fit.r2))).toFixed(3)} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
