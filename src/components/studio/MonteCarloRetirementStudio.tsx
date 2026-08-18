"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";
import { Equation } from "./Equation";

const PRESETS: Record<string, { start: number; contrib: number; ret: number; vol: number; years: number }> = {
  "Young saver": { start: 50, contrib: 15, ret: 8, vol: 16, years: 40 },
  "Mid-career": { start: 400, contrib: 30, ret: 6, vol: 12, years: 20 },
  "Near retirement": { start: 1200, contrib: 20, ret: 4.5, vol: 7, years: 10 },
  "Aggressive glide": { start: 200, contrib: 25, ret: 10, vol: 22, years: 30 },
};

export function MonteCarloRetirementStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ start, contrib, ret, vol, years }, update] = useShareableNumbers({ start: 500, contrib: 20, ret: 6, vol: 12, years: 30 });
  // deterministic percentile bands (lognormal approx) — no RNG
  const r = ret / 100, s = vol / 100;
  const band = (z: number, t: number) => { let v = start; for (let i = 0; i < t; i++) v = v * (1 + r + z * s / Math.sqrt(1)) + contrib; return v; };
  const median = band(0, years), p10 = band(-1.28, years), p90 = band(1.28, years);
  const spread = p10 > 0 ? p90 / p10 : Infinity;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, oy = H - 32, pw = W - 70, ph = H - 52, ymax = band(1.28, years) * 1.1;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const line = (z: number, col: string, w: number) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); for (let t = 0; t <= years; t++) { const x = ox + t / years * pw, y = oy - (band(z, t) / ymax) * ph; t ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); };
    line(1.28, "#334155", 1); line(-1.28, "#334155", 1); line(0.52, "#0e7490", 1); line(-0.52, "#0e7490", 1); line(0, "#22d3ee", 2);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("portfolio value — median (cyan) with 10th–90th percentile band", ox + 6, oy - ph + 12); ctx.fillText("years →", ox + pw - 44, oy + 18);
  }, [start, contrib, ret, vol, years]);

  const explain =
    vol >= 18
      ? `At ${vol}% volatility the 90th-percentile ending is about ${spread.toFixed(1)}× the 10th — same average return, wildly different destinies. The sequence of returns, not just the average, decides where you land.`
      : vol <= 6
      ? `Low ${vol}% volatility keeps the band tight (90th ≈ ${spread.toFixed(1)}× the 10th), so the median is a fairly honest forecast here.`
      : `The 10th–90th band spans about ${spread.toFixed(1)}× — even at a steady ${ret}% average, uncertainty compounds over ${years} years into a wide range of endings.`;

  const code = `import numpy as np
rng = np.random.default_rng(0)
start, contrib, ret, vol, years = ${start}, ${contrib}, ${ret}/100, ${vol}/100, ${years}
V = np.full(10000, float(start))
for _ in range(years):
    z = rng.standard_normal(V.size)
    V = V*(1+ret+vol*z) + contrib
print("median", np.median(V), "p10", np.percentile(V,10), "p90", np.percentile(V,90))`;

  return (
    <StudioChrome title="Retirement Monte Carlo" tagline="range of outcomes, not one line"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Starting savings ($k)" value={start} min={0} max={2000} step={25} onChange={(v) => update({ start: v })} />
        <Slider label="Annual contribution ($k)" value={contrib} min={0} max={100} step={1} onChange={(v) => update({ contrib: v })} />
        <Slider label="Expected return (%)" value={ret} min={2} max={12} step={0.5} onChange={(v) => update({ ret: v })} />
        <Slider label="Volatility (%)" value={vol} min={2} max={25} step={1} onChange={(v) => update({ vol: v })} />
        <Slider label="Years" value={years} min={5} max={45} step={1} onChange={(v) => update({ years: v })} />
        <p className="mt-3 text-xs text-slate-500">Markets are uncertain, so a single projection lies. This shows a band of outcomes: even with the same average return, higher volatility widens the gap between a great result and a disappointing one. Educational tool, not financial advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Median outcome" value={`$${median.toFixed(0)}k`} />
        <Stat label="10th percentile" value={`$${p10.toFixed(0)}k`} />
        <Stat label="90th percentile" value={`$${p90.toFixed(0)}k`} />
        <Equation tex={`W_{t+1}=W_t\\,(1+${r.toFixed(3)})+${contrib},\\quad \\tilde W_{${years}}\\approx \\$${median.toFixed(0)}\\text{k}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
