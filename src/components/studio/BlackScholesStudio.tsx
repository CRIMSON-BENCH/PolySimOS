"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";
import { Equation } from "./Equation";

function normCDF(x: number) { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const d = 0.3989423 * Math.exp(-x * x / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; }
function normPDF(x: number) { return 0.3989423 * Math.exp(-x * x / 2); }

const PRESETS: Record<string, { S: number; K: number; sigma: number; T: number }> = {
  "At-the-money": { S: 100, K: 100, sigma: 0.25, T: 0.5 },
  "Deep in-the-money": { S: 160, K: 100, sigma: 0.25, T: 0.5 },
  "Out-of-the-money": { S: 70, K: 100, sigma: 0.25, T: 0.5 },
  "High volatility": { S: 100, K: 100, sigma: 0.7, T: 1 },
};

export function BlackScholesStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ S, K, T, r, sigma }, update] = useShareableNumbers({ S: 100, K: 100, T: 0.5, r: 0.04, sigma: 0.25 });

  const bs = (Sv: number) => {
    const d1 = (Math.log(Sv / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    const call = Sv * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
    const put = K * Math.exp(-r * T) * normCDF(-d2) - Sv * normCDF(-d1);
    return { d1, d2, call, put };
  };
  const { d1, d2, call, put } = bs(S);
  const delta = normCDF(d1); const gamma = normPDF(d1) / (S * sigma * Math.sqrt(T));
  const vega = S * normPDF(d1) * Math.sqrt(T) / 100; const theta = (-(S * normPDF(d1) * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * normCDF(d2)) / 365;

  useEffect(() => {
    const W = 500, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 30, pw = W - 60, ph = H - 50; const sMax = K * 2.2;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const maxP = bs(sMax).call;
    // intrinsic value
    ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); ctx.beginPath(); for (let i = 0; i <= pw; i++) { const sv = (i / pw) * sMax; const y = oy - (Math.max(0, sv - K) / maxP) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke(); ctx.setLineDash([]);
    // call price curve
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const sv = (i / pw) * sMax; const y = oy - (bs(sv).call / maxP) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    // current S marker
    const mx = ox + (S / sMax) * pw; ctx.strokeStyle = "#f472b6"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(mx, oy); ctx.lineTo(mx, oy - ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("call value (cyan) vs intrinsic (dashed)", ox + 8, oy - ph + 12); ctx.fillText("underlying price →", ox + pw - 100, oy + 18);
  }, [S, K, T, r, sigma]);

  const moneyness = S > K * 1.02 ? "in-the-money" : S < K * 0.98 ? "out-of-the-money" : "at-the-money";
  const explain =
    `Spot ${S} vs strike ${K} makes this call ${moneyness} (intrinsic value ${Math.max(0, S - K).toFixed(2)}). ` +
    `A higher volatility σ (now ${(sigma * 100).toFixed(0)}%) and a longer time to expiry (now ${T.toFixed(2)} yr) both raise the option's value by adding time value — more room for the underlying to finish favorably. ` +
    (S > K * 1.3
      ? "Because it is deep in-the-money, delta is near 1 and the option now tracks the underlying almost one-for-one."
      : "As the option moves deeper in-the-money its delta approaches 1 and it behaves like the underlying itself.");

  const code = `import numpy as np
from scipy.stats import norm

S, K, T, r, sigma = ${S}, ${K}, ${T}, ${r}, ${sigma}
d1 = (np.log(S / K) + (r + sigma**2 / 2) * T) / (sigma * np.sqrt(T))
d2 = d1 - sigma * np.sqrt(T)
call = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
put = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
print("call", round(call, 2), "put", round(put, 2))`;

  return (
    <StudioChrome title="Black-Scholes Option Pricing" tagline="fair value + the Greeks"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Spot price S" value={S} min={20} max={200} step={1} onChange={(v) => update({ S: v })} />
        <Slider label="Strike K" value={K} min={20} max={200} step={1} onChange={(v) => update({ K: v })} />
        <Slider label="Time to expiry (yr)" value={T} min={0.02} max={2} step={0.02} onChange={(v) => update({ T: v })} />
        <Slider label="Risk-free rate" value={r} min={0} max={0.1} step={0.005} onChange={(v) => update({ r: v })} />
        <Slider label="Volatility σ" value={sigma} min={0.05} max={0.8} step={0.01} onChange={(v) => update({ sigma: v })} />
        <p className="mt-3 text-xs text-slate-500">The Black-Scholes formula prices a European option from spot, strike, time, rate, and volatility. The Greeks measure sensitivity: delta to price, gamma to delta, vega to volatility, theta to time decay. Educational tool — not investment advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Call price" value={`$${call.toFixed(2)}`} /><Stat label="Put price" value={`$${put.toFixed(2)}`} /><Stat label="Delta (call)" value={delta.toFixed(3)} /><Stat label="Gamma" value={gamma.toFixed(4)} /><Stat label="Vega (per 1%)" value={vega.toFixed(3)} /><Stat label="Theta (per day)" value={theta.toFixed(3)} /><Equation tex={`C = S\\,N(d_1) - K\\,e^{-rT}N(d_2) = ${S}\\cdot ${normCDF(d1).toFixed(3)} - ${K}\\,e^{-${(r * T).toFixed(3)}}\\cdot ${normCDF(d2).toFixed(3)} = \\$${call.toFixed(2)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
