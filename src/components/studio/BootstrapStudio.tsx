"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";
import { Equation } from "./Equation";

const PRESETS: Record<string, { sampleSize: number; B: number }> = {
  "Tiny sample (n=10)": { sampleSize: 10, B: 2000 },
  "Standard (n=25)": { sampleSize: 25, B: 2000 },
  "Large sample (n=100)": { sampleSize: 100, B: 2000 },
  "Heavy resample": { sampleSize: 25, B: 5000 },
};

export function BootstrapStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ sampleSize, B }, update] = useShareableNumbers({ sampleSize: 25, B: 2000 });
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

  const width = ci.hi - ci.lo;
  const explain =
    sampleSize <= 15
      ? "With only a handful of data points, the interval is wide — the bootstrap honestly shows how little a small sample pins down the true mean."
      : sampleSize >= 80
      ? "A large original sample tightens the interval: resampling it rarely lands far from the sample mean, so the estimate is well-constrained."
      : B >= 4000
      ? "Thousands of resamples make the interval edges smooth and stable — beyond a point, adding resamples refines precision but cannot narrow a CI set by sample size."
      : "The spread of the resampled means is the confidence interval — no normality assumption needed. Sample size sets its width; more resamples only sharpen its edges.";

  const code = `import numpy as np
rng = np.random.default_rng(${seed})
n, B = ${Math.round(sampleSize)}, ${B}
data = rng.exponential(20.0, n) + 10.0        # skewed original sample
boots = [rng.choice(data, n, replace=True).mean() for _ in range(B)]
lo, hi = np.percentile(boots, [2.5, 97.5])
print("mean", data.mean(), "95% CI", lo, hi)`;

  return (
    <StudioChrome title="Bootstrap Resampling" tagline="confidence without formulas"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Original sample size" value={sampleSize} min={5} max={100} step={5} onChange={(v) => update({ sampleSize: v })} />
        <Slider label="Bootstrap resamples B" value={B} min={200} max={5000} step={200} onChange={(v) => update({ B: v })} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">New original sample</button>
        <p className="mt-3 text-xs text-slate-500">The bootstrap estimates uncertainty by resampling your data with replacement thousands of times and recomputing the statistic each time. The spread of those bootstrap means gives a confidence interval — no formula or normality assumption required. Powerful when the math is intractable.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Sample mean" value={ci.mean.toFixed(2)} />
        <Stat label="95% CI low" value={ci.lo.toFixed(2)} />
        <Stat label="95% CI high" value={ci.hi.toFixed(2)} />
        <Stat label="CI width" value={width.toFixed(2)} />
        <Equation tex={`\\hat{\\theta}^{*}=\\frac{1}{${Math.round(sampleSize)}}\\sum_{i=1}^{${Math.round(sampleSize)}}x_i^{*},\\quad \\mathrm{CI}_{95\\%}=[\\hat{\\theta}^{*}_{(2.5\\%)},\\,\\hat{\\theta}^{*}_{(97.5\\%)}]=[${ci.lo.toFixed(2)},\\,${ci.hi.toFixed(2)}]`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
