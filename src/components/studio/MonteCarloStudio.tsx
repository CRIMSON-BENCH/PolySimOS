"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";
import { Equation } from "./Equation";

const PRESETS: Record<string, { S0: number; mu: number; sigma: number; years: number }> = {
  "Blue chip": { S0: 100, mu: 0.07, sigma: 0.15, years: 5 },
  "High-flyer": { S0: 50, mu: 0.15, sigma: 0.45, years: 3 },
  "Bond-like": { S0: 100, mu: 0.03, sigma: 0.06, years: 10 },
  "Bear market": { S0: 200, mu: -0.05, sigma: 0.3, years: 2 },
};

// Geometric Brownian Motion Monte Carlo.
export function MonteCarloStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ S0, mu, sigma, years }, update] = useShareableNumbers({ S0: 100, mu: 0.07, sigma: 0.2, years: 1 });
  const [seed, setSeed] = useState(1);
  const [median, setMedian] = useState(0);
  const [p5, setP5] = useState(0);
  const [p95, setP95] = useState(0);

  useEffect(() => {
    const W = 540, H = 380; const steps = 120; const paths = 200; const dt = years / steps;
    let s = seed * 24571 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const gauss = () => { let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const finals: number[] = []; const allPaths: number[][] = [];
    for (let p = 0; p < paths; p++) { let S = S0; const path = [S]; for (let t = 0; t < steps; t++) { S *= Math.exp((mu - sigma * sigma / 2) * dt + sigma * Math.sqrt(dt) * gauss()); path.push(S); } finals.push(S); allPaths.push(path); }
    finals.sort((a, b) => a - b); const med = finals[finals.length >> 1]; setMedian(med); setP5(finals[(finals.length * 0.05) | 0]); setP95(finals[(finals.length * 0.95) | 0]);
    const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, pw = W - 160, ph = H - 50, oy = H - 30; const yMax = finals[finals.length - 1] * 1.05, yMin = 0;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy - ph); ctx.lineTo(ox, oy); ctx.stroke();
    allPaths.forEach((path, i) => { ctx.strokeStyle = `rgba(34,211,238,${i < 5 ? 0.9 : 0.06})`; ctx.lineWidth = i < 5 ? 1.5 : 1; ctx.beginPath(); path.forEach((v, t) => { const x = ox + (t / steps) * pw; const y = oy - ((v - yMin) / (yMax - yMin)) * ph; t ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); });
    // histogram of finals on right
    const hx = ox + pw + 10, hw = 100; const bins = 30; const hist = new Array(bins).fill(0); finals.forEach((f) => { const b = Math.min(bins - 1, ((f - yMin) / (yMax - yMin) * bins) | 0); hist[b]++; }); const hmax = Math.max(...hist);
    hist.forEach((cnt, b) => { const y = oy - ((b + 0.5) / bins) * ph; const w = (cnt / hmax) * hw; ctx.fillStyle = "#f472b6"; ctx.fillRect(hx, y - ph / bins / 2, w, ph / bins - 1); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("price paths", ox + 6, oy - ph + 12); ctx.fillText("outcome dist.", hx, oy - ph + 12);
  }, [S0, mu, sigma, years, seed]);

  const naive = S0 * Math.exp(mu * years);
  const explain =
    sigma >= 0.35
      ? `High ${(sigma * 100).toFixed(0)}% volatility drags the median (~$${median.toFixed(0)}) well below the naive $${naive.toFixed(0)} you get from drift alone — big losses cost more than equal-size gains recover, and the outcome distribution skews right.`
      : mu < 0
      ? `With negative drift most simulated paths erode toward zero; the median (~$${median.toFixed(0)}) sits below the $${S0} start even though a lucky few paths finish high.`
      : `Median outcome is about $${median.toFixed(0)}, just under the drift-only $${naive.toFixed(0)} — GBM compounds in log-space, so volatility always pulls the typical path below the average.`;

  const code = `import numpy as np
rng = np.random.default_rng(${seed})
S0, mu, sigma, years = ${S0}, ${mu}, ${sigma}, ${years}
steps, paths = 120, 200
dt = years/steps
Z = rng.standard_normal((paths, steps))
logret = (mu - sigma**2/2)*dt + sigma*np.sqrt(dt)*Z
S = S0*np.exp(np.cumsum(logret, axis=1))[:, -1]
print("median", np.median(S), "p5", np.percentile(S,5), "p95", np.percentile(S,95))`;

  return (
    <StudioChrome title="Monte Carlo Price Simulation" tagline="geometric Brownian motion"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Initial price S₀" value={S0} min={10} max={500} step={10} onChange={(v) => update({ S0: v })} />
        <Slider label="Expected return μ" value={mu} min={-0.1} max={0.2} step={0.01} onChange={(v) => update({ mu: v })} />
        <Slider label="Volatility σ" value={sigma} min={0.05} max={0.6} step={0.01} onChange={(v) => update({ sigma: v })} />
        <Slider label="Horizon (years)" value={years} min={0.25} max={10} step={0.25} onChange={(v) => update({ years: v })} />
        <button onClick={() => setSeed((n) => n + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">Resample</button>
        <p className="mt-3 text-xs text-slate-500">Geometric Brownian motion models a price with constant drift and random volatility — the assumption behind Black-Scholes. Running hundreds of simulated paths reveals the full distribution of outcomes, not just an average. Educational tool, not investment advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Median outcome" value={`$${median.toFixed(0)}`} /><Stat label="5th percentile" value={`$${p5.toFixed(0)}`} /><Stat label="95th percentile" value={`$${p95.toFixed(0)}`} /><Equation tex={`S_{t+\\Delta t}=S_t\\,e^{(${mu}-\\frac{${sigma}^2}{2})\\Delta t+${sigma}\\sqrt{\\Delta t}\\,Z},\\quad \\tilde S_{${years}}\\approx \\$${median.toFixed(0)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={380} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
