"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

function normCDF(x: number) { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const d = 0.3989423 * Math.exp(-x * x / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; }

const PRESETS: Record<string, { nA: number; cA: number; nB: number; cB: number }> = {
  "Clear win": { nA: 2000, cA: 200, nB: 2000, cB: 260 },
  "No real effect": { nA: 1500, cA: 150, nB: 1500, cB: 155 },
  "Underpowered": { nA: 300, cA: 30, nB: 300, cB: 39 },
  "Huge sample, tiny lift": { nA: 5000, cA: 500, nB: 5000, cB: 540 },
};

export function ABTestStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ nA, cA, nB, cB }, update] = useShareableNumbers({ nA: 1000, cA: 100, nB: 1000, cB: 125 });

  const pA = cA / nA, pB = cB / nB; const pPool = (cA + cB) / (nA + nB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / nA + 1 / nB));
  const z = se > 0 ? (pB - pA) / se : 0; const pVal = 2 * (1 - normCDF(Math.abs(z)));
  const lift = pA > 0 ? (pB - pA) / pA * 100 : 0; const sig = pVal < 0.05;

  const explain = sig
    ? `B beats A by ${lift.toFixed(1)}% with p=${pVal.toFixed(3)} (below 0.05): across ${(nA + nB).toLocaleString()} visitors that gap is unlikely to be chance.`
    : Math.abs(lift) >= 5
    ? `B looks ${lift.toFixed(1)}% different, but with only ${(nA + nB).toLocaleString()} visitors p=${pVal.toFixed(3)} — the sample is too small to call it real yet.`
    : `A and B sit within the noise (p=${pVal.toFixed(3)}); this data shows no convincing difference in conversion rate.`;

  const code = `from math import sqrt, erf
nA, cA, nB, cB = ${nA}, ${cA}, ${nB}, ${cB}
pA, pB = cA / nA, cB / nB
pool = (cA + cB) / (nA + nB)
se = sqrt(pool * (1 - pool) * (1 / nA + 1 / nB))
z = (pB - pA) / se
p = 2 * (1 - 0.5 * (1 + erf(abs(z) / sqrt(2))))
print("lift", (pB - pA) / pA * 100, "p-value", p)`;

  useEffect(() => {
    const W = 500, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // two conversion-rate distributions (normal approx)
    const ox = 30, oy = H - 40, pw = W - 60, ph = H - 70; const lo = Math.min(pA, pB) - 0.06, hi = Math.max(pA, pB) + 0.06;
    const X = (p: number) => ox + ((p - lo) / (hi - lo)) * pw;
    const draw = (p: number, n: number, col: string) => { const s = Math.sqrt(p * (1 - p) / n); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const x = lo + (i / 200) * (hi - lo); const y = oy - Math.exp(-((x - p) ** 2) / (2 * s * s)) * ph * 0.9; i ? ctx.lineTo(ox + (i / 200) * pw, y) : ctx.moveTo(ox + (i / 200) * pw, y); } ctx.stroke();
      ctx.strokeStyle = col; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(p), oy); ctx.lineTo(X(p), oy - ph * 0.9); ctx.stroke(); ctx.setLineDash([]); };
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.stroke();
    draw(pA, nA, "#64748b"); draw(pB, nB, "#22d3ee");
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("A (gray) vs B (cyan) conversion rate", ox + 6, 16); ctx.fillText("conversion rate →", ox + pw - 110, oy + 20);
  }, [nA, cA, nB, cB]);

  return (
    <StudioChrome title="A/B Test Significance" tagline="two-proportion z-test"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="A visitors" value={nA} min={100} max={5000} step={100} onChange={(v) => update({ nA: v })} />
        <Slider label="A conversions" value={cA} min={0} max={nA} step={5} onChange={(v) => update({ cA: v })} />
        <Slider label="B visitors" value={nB} min={100} max={5000} step={100} onChange={(v) => update({ nB: v })} />
        <Slider label="B conversions" value={cB} min={0} max={nB} step={5} onChange={(v) => update({ cB: v })} />
        <p className="mt-3 text-xs text-slate-500">An A/B test compares two conversion rates to see if a difference is real or just noise. The two-proportion z-test pools the data to estimate the standard error, then a p-value below 0.05 signals a statistically significant difference. Bigger samples separate the two curves and make small lifts detectable.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Rate A" value={`${(pA * 100).toFixed(2)}%`} /><Stat label="Rate B" value={`${(pB * 100).toFixed(2)}%`} /><Stat label="Lift" value={`${lift > 0 ? "+" : ""}${lift.toFixed(1)}%`} /><Stat label="p-value" value={pVal.toFixed(4)} /><Stat label="Result" value={sig ? "significant" : "not significant"} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
