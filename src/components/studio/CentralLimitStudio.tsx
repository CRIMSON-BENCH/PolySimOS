"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

type Dist = "uniform" | "exponential" | "bimodal";

const PRESETS: Record<string, { n: number }> = {
  "Single draw (n=1)": { n: 1 },
  "Small (n=5)": { n: 5 },
  "Medium (n=15)": { n: 15 },
  "Large (n=50)": { n: 50 },
};

export function CentralLimitStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dist, setDist] = useState<Dist>("exponential");
  const [{ n }, update] = useShareableNumbers({ n: 10 });
  const means = useRef<number[]>([]);
  const [count, setCount] = useState(0);
  const seedRef = useRef(7);
  const distRef = useRef(dist); distRef.current = dist;
  const nRef = useRef(n); nRef.current = n;

  const reset = () => { means.current = []; setCount(0); seedRef.current = 7; };
  useEffect(reset, [dist, n]);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw1 = () => { let s = seedRef.current; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; seedRef.current = s; return s / 4294967296; };
      if (distRef.current === "uniform") return rnd();
      if (distRef.current === "exponential") return -Math.log(1 - rnd()) / 2;
      return rnd() < 0.5 ? rnd() * 0.3 : 0.7 + rnd() * 0.3; };
    for (let si = 0; si < steps; si++) {
      for (let k = 0; k < 15; k++) { let sum = 0; for (let i = 0; i < Math.round(nRef.current); i++) sum += draw1(); means.current.push(sum / Math.round(nRef.current)); }
    }
    setCount(means.current.length);
    const W = 540, H = 320; const ctx = hidpi(canvas, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const bins = 40; const hist = new Array(bins).fill(0); const lo = 0, hi = distRef.current === "exponential" ? 1.2 : 1;
    means.current.forEach((m) => { const b = Math.min(bins - 1, Math.max(0, ((m - lo) / (hi - lo) * bins) | 0)); hist[b]++; });
    const hmax = Math.max(...hist, 1); const ox = 30, oy = H - 30, pw = W - 60, ph = H - 60;
    for (let b = 0; b < bins; b++) { const x = ox + (b / bins) * pw; const bh = (hist[b] / hmax) * ph; ctx.fillStyle = "#22d3ee"; ctx.fillRect(x, oy - bh, pw / bins - 1, bh); }
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`distribution of sample means (n=${Math.round(nRef.current)})`, ox + 6, 18);
  };

  const t = useTransport(frame);

  const nn = Math.round(n);
  const explain =
    nn <= 2
      ? `At n=${nn} each “mean” is barely an average, so the histogram still mirrors the raw ${dist} shape — skew and lumps and all.`
      : nn < 15
      ? `At n=${nn} the sample means are already piling into a bell even though the ${dist} source is not normal — the central limit theorem kicking in.`
      : `At n=${nn} the distribution of means is tightly, symmetrically normal and about √${nn}× narrower than the ${dist} source — the textbook central limit theorem.`;

  const code = `import numpy as np
rng = np.random.default_rng(7)
n, dist = ${nn}, "${dist}"
def sample_mean():
    u = rng.random(n)
    if dist == "uniform":      x = u
    elif dist == "exponential": x = -np.log(1 - u) / 2
    else:                      x = np.where(u < 0.5, rng.random(n)*0.3, 0.7 + rng.random(n)*0.3)
    return x.mean()
means = np.array([sample_mean() for _ in range(5000)])
print("mean of means", means.mean(), "std", means.std())`;

  return (
    <StudioChrome title="Central Limit Theorem" tagline="means go normal"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { reset(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <div className="mb-3 grid grid-cols-3 gap-2">{(["uniform", "exponential", "bimodal"] as Dist[]).map((d) => <button key={d} onClick={() => setDist(d)} className={`rounded-lg px-1 py-1 text-xs font-semibold capitalize ${dist === d ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{d}</button>)}</div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Sample size n" value={n} min={1} max={50} step={1} onChange={(v) => update({ n: v })} />
        <p className="mt-3 text-xs text-slate-500">The central limit theorem is why the normal distribution is everywhere: no matter how skewed or lumpy the source distribution, the distribution of sample means becomes bell-shaped as the sample size grows. Try a heavily skewed exponential at n=1, then raise n and watch it turn normal.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Samples drawn" value={count.toLocaleString()} /><Stat label="Sample size" value={String(Math.round(n))} /><Stat label="Source" value={dist} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
