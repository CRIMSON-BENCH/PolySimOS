"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const ncdf = (x: number) => { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const d = 0.3989423 * Math.exp(-x * x / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; };
const npdf = (x: number) => 0.3989423 * Math.exp(-x * x / 2);

const PRESETS: Record<string, { S: number; K: number; T: number; vol: number; rf: number }> = {
  "At the money": { S: 100, K: 100, T: 0.5, vol: 0.25, rf: 0.04 },
  "Deep in the money": { S: 130, K: 100, T: 0.5, vol: 0.25, rf: 0.04 },
  "Near expiry": { S: 100, K: 100, T: 0.04, vol: 0.25, rf: 0.04 },
  "High volatility": { S: 100, K: 100, T: 0.5, vol: 0.6, rf: 0.04 },
};

export function OptionsGreeksStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ S, K, T, vol, rf }, update] = useShareableNumbers({ S: 100, K: 100, T: 0.5, vol: 0.25, rf: 0.04 });
  const greeks = (s: number) => { const d1 = (Math.log(s / K) + (rf + vol * vol / 2) * T) / (vol * Math.sqrt(T)); const d2 = d1 - vol * Math.sqrt(T); return { delta: ncdf(d1), gamma: npdf(d1) / (s * vol * Math.sqrt(T)), vega: s * npdf(d1) * Math.sqrt(T) / 100, theta: (-(s * npdf(d1) * vol) / (2 * Math.sqrt(T)) - rf * K * Math.exp(-rf * T) * ncdf(d2)) / 365, price: s * ncdf(d1) - K * Math.exp(-rf * T) * ncdf(d2) }; };
  const g = greeks(S);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 32, pw = W - 65, ph = H - 52, smin = K * 0.5, smax = K * 1.5;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const s = smin + (smax - smin) * i / pw; const y = oy - greeks(s).delta * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    const mx = ox + ((S - smin) / (smax - smin)) * pw; ctx.strokeStyle = "#f472b6"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(mx, oy); ctx.lineTo(mx, oy - g.delta * ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("call delta vs underlying price (0 → 1)", ox + 6, oy - ph + 12); ctx.fillText("spot →", ox + pw - 44, oy + 18);
  }, [S, K, T, vol, rf, g.delta]);

  const moneyness = S > K * 1.03 ? "in the money" : S < K * 0.97 ? "out of the money" : "at the money";
  const explain =
    T < 0.1
      ? `With little time left, theta decay dominates: this ${moneyness} call loses about $${Math.abs(g.theta).toFixed(2)} of value per day, and gamma is at its sharpest.`
      : g.delta > 0.75
      ? `Delta ${g.delta.toFixed(2)} means the call moves nearly one-for-one with the stock — it behaves much like owning the shares.`
      : g.delta < 0.25
      ? `Delta ${g.delta.toFixed(2)} means the call barely responds to small moves; it is mostly a bet on a large rally or rising volatility.`
      : `Near the money, gamma and vega peak: the option is most sensitive to both price swings and changes in volatility (vega ${g.vega.toFixed(2)} per 1% vol).`;

  const code = `import numpy as np
from math import log, sqrt, exp
from scipy.stats import norm
S, K, T, vol, rf = ${S}, ${K}, ${T}, ${vol}, ${rf}
d1 = (log(S / K) + (rf + vol**2 / 2) * T) / (vol * sqrt(T))
d2 = d1 - vol * sqrt(T)
price = S * norm.cdf(d1) - K * exp(-rf * T) * norm.cdf(d2)
delta = norm.cdf(d1)
gamma = norm.pdf(d1) / (S * vol * sqrt(T))
vega = S * norm.pdf(d1) * sqrt(T) / 100
theta = (-(S * norm.pdf(d1) * vol) / (2 * sqrt(T)) - rf * K * exp(-rf * T) * norm.cdf(d2)) / 365
print(price, delta, gamma, vega, theta)`;

  return (
    <StudioChrome title="Option Greeks (Black–Scholes)" tagline="delta, gamma, vega, theta"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Spot price S" value={S} min={50} max={150} step={1} onChange={(v) => update({ S: v })} />
        <Slider label="Strike K" value={K} min={50} max={150} step={1} onChange={(v) => update({ K: v })} />
        <Slider label="Time to expiry (yr)" value={T} min={0.02} max={2} step={0.02} onChange={(v) => update({ T: v })} />
        <Slider label="Volatility σ" value={vol} min={0.05} max={0.8} step={0.01} onChange={(v) => update({ vol: v })} />
        <Slider label="Risk-free rate" value={rf} min={0} max={0.1} step={0.005} onChange={(v) => update({ rf: v })} />
        <p className="mt-3 text-xs text-slate-500">The Greeks measure how an option&apos;s value reacts: delta to the underlying price, gamma to delta itself, vega to volatility, theta to the passage of time. Traders hedge by neutralizing them. Educational tool, not financial advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Call price" value={`$${g.price.toFixed(2)}`} />
        <Stat label="Delta" value={g.delta.toFixed(3)} />
        <Stat label="Gamma" value={g.gamma.toFixed(4)} />
        <Stat label="Vega (per 1% vol)" value={g.vega.toFixed(3)} />
        <Stat label="Theta (per day)" value={g.theta.toFixed(3)} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
