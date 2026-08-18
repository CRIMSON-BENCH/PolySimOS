"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const Z: Record<number, number> = { 80: 1.2816, 90: 1.6449, 95: 1.96, 99: 2.5758 };

const PRESETS: Record<string, { n: number }> = {
  "Tiny sample (n=10)": { n: 10 },
  "Classroom (n=30)": { n: 30 },
  "Large study (n=100)": { n: 100 },
  "Very large (n=200)": { n: 200 },
};

export function ConfidenceIntervalStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [conf, setConf] = useState(95);
  const [{ n }, update] = useShareableNumbers({ n: 30 });
  const [seed, setSeed] = useState(1);
  const [coverage, setCoverage] = useState(0);

  useEffect(() => {
    let s = seed * 3037 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const trueMean = 50, sd = 10; const z = Z[conf]; const trials = 50; let hit = 0;
    const W = 540, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, pw = W - 60; const X = (v: number) => ox + ((v - 30) / 40) * pw;
    // true mean line
    ctx.strokeStyle = "#a3e635"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(X(trueMean), 20); ctx.lineTo(X(trueMean), H - 20); ctx.stroke(); ctx.setLineDash([]);
    for (let t = 0; t < trials; t++) { let sum = 0, sum2 = 0; for (let i = 0; i < Math.round(n); i++) { const x = trueMean + gauss() * sd; sum += x; sum2 += x * x; }
      const m = sum / n; const se = sd / Math.sqrt(n); const lo = m - z * se, hi = m + z * se; const contains = lo <= trueMean && trueMean <= hi; if (contains) hit++;
      const y = 24 + t * (H - 48) / trials; ctx.strokeStyle = contains ? "#22d3ee" : "#ef4444"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(lo), y); ctx.lineTo(X(hi), y); ctx.stroke(); ctx.fillStyle = contains ? "#22d3ee" : "#ef4444"; ctx.beginPath(); ctx.arc(X(m), y, 2, 0, 7); ctx.fill(); }
    setCoverage(hit / trials * 100);
    ctx.fillStyle = "#bef264"; ctx.font = "11px sans-serif"; ctx.fillText("true mean", X(trueMean) + 4, 16);
  }, [conf, n, seed]);

  const explain = `About ${coverage.toFixed(0)}% of these 50 intervals captured the true mean — close to the ${conf}% you asked for. Raising n from ${n} tightens each interval (SE = σ/√n) but does not change that hit rate: the confidence level, not the sample size, sets how often you are right.`;

  const code = `import numpy as np
conf, n = ${conf}, ${n}
z = {80: 1.2816, 90: 1.6449, 95: 1.96, 99: 2.5758}[conf]
mu, sd, trials = 50, 10, 50
hits = 0
for _ in range(trials):
    x = np.random.normal(mu, sd, n)
    m, se = x.mean(), sd / np.sqrt(n)
    if m - z * se <= mu <= m + z * se:
        hits += 1
print(f"coverage {100 * hits / trials:.0f}% (nominal {conf}%)")`;

  return (
    <StudioChrome title="Confidence Intervals" tagline="what 95% really means"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <div className="mb-3 grid grid-cols-4 gap-1">{Object.keys(Z).map((c) => <button key={c} onClick={() => setConf(+c)} className={`rounded-lg px-1 py-1 text-xs font-semibold ${conf === +c ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{c}%</button>)}</div>
        <Slider label="Sample size n" value={n} min={5} max={200} step={5} onChange={(v) => update({ n: v })} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">Draw 50 new samples</button>
        <p className="mt-3 text-xs text-slate-500">A confidence interval is often misread. It does not mean the true value has a 95% chance of being in one interval — it means that if you repeated the experiment many times, about 95% of the intervals would contain the true mean. The red intervals here are the unlucky ones that miss it.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Confidence level" value={`${conf}%`} /><Stat label="Observed coverage" value={`${coverage.toFixed(0)}%`} /><Stat label="Intervals shown" value="50" /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
