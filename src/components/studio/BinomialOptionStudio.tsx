"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { S: number; K: number; vol: number; T: number; steps: number }> = {
  "At-the-money": { S: 100, K: 100, vol: 0.25, T: 1, steps: 4 },
  "Deep in-the-money": { S: 130, K: 100, vol: 0.2, T: 1, steps: 5 },
  "Out-of-the-money": { S: 90, K: 110, vol: 0.3, T: 0.5, steps: 4 },
  "High vol, long-dated": { S: 100, K: 100, vol: 0.6, T: 2, steps: 8 },
};

export function BinomialOptionStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ S, K, vol, T, steps }, update] = useShareableNumbers({ S: 100, K: 100, vol: 0.25, T: 1, steps: 4 });
  const dt = T / steps, u = Math.exp(vol * Math.sqrt(dt)), d = 1 / u, p = (Math.exp(0.04 * dt) - d) / (u - d);
  // price via backward induction (European call)
  const payoff: number[] = []; for (let j = 0; j <= steps; j++) payoff[j] = Math.max(0, S * Math.pow(u, j) * Math.pow(d, steps - j) - K);
  const vals = payoff.slice(); for (let n = steps - 1; n >= 0; n--) for (let j = 0; j <= n; j++) vals[j] = Math.exp(-0.04 * dt) * (p * vals[j + 1] + (1 - p) * vals[j]);
  const price = vals[0];
  const intrinsic = Math.max(0, S - K);
  const timeValue = price - intrinsic;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H / 2, dx = (W - 80) / steps, dy = 26;
    for (let n = 0; n <= steps; n++) for (let j = 0; j <= n; j++) { const x = ox + n * dx, y = oy - (n - 2 * j) * dy; if (n < steps) { ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y - dy); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke(); } }
    for (let n = 0; n <= steps; n++) for (let j = 0; j <= n; j++) { const x = ox + n * dx, y = oy - (n - 2 * j) * dy; const price = S * Math.pow(u, j) * Math.pow(d, n - j); ctx.fillStyle = price > K ? "#22d3ee" : "#64748b"; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("binomial price tree — cyan nodes finish in-the-money", 12, 20);
  }, [S, K, vol, T, steps, u, d]);

  const explain =
    intrinsic > 0 && timeValue / Math.max(price, 0.01) < 0.25
      ? `Deep in-the-money: most of the ${price.toFixed(2)} price is intrinsic value (S − K = ${intrinsic.toFixed(0)}), so the option behaves almost like the stock itself.`
      : S < K
      ? `Out-of-the-money (S < K): the entire ${price.toFixed(2)} price is time value — you're paying purely for the chance that ${vol >= 0.4 ? "high" : "future"} volatility pushes the stock above the strike before expiry.`
      : vol >= 0.5 || T >= 1.5
      ? `High volatility and long horizon inflate the option: more time and bigger swings widen the tree's tails, so the risk-neutral expected payoff — and the price — climb.`
      : `Near the money the price is almost all time value; it rises with volatility (σ = ${vol.toFixed(2)}) and time (T = ${T.toFixed(1)}yr) because both widen the cone of possible ending prices.`;

  const code = `import numpy as np
S, K, vol, T, steps, r = ${S}, ${K}, ${vol}, ${T}, ${steps}, 0.04
dt = T/steps; u = np.exp(vol*np.sqrt(dt)); d = 1/u
p = (np.exp(r*dt) - d)/(u - d)
vals = [max(0, S*u**j*d**(steps-j) - K) for j in range(steps+1)]
for n in range(steps-1, -1, -1):
    vals = [np.exp(-r*dt)*(p*vals[j+1] + (1-p)*vals[j]) for j in range(n+1)]
print("call price", round(vals[0], 2))`;

  return (
    <StudioChrome title="Binomial Option Pricing" tagline="a lattice of possible futures"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Spot price S" value={S} min={50} max={150} step={1} onChange={(v) => update({ S: v })} />
        <Slider label="Strike K" value={K} min={50} max={150} step={1} onChange={(v) => update({ K: v })} />
        <Slider label="Volatility σ" value={vol} min={0.05} max={0.8} step={0.01} onChange={(v) => update({ vol: v })} />
        <Slider label="Time to expiry (yr)" value={T} min={0.1} max={2} step={0.1} onChange={(v) => update({ T: v })} />
        <Slider label="Tree steps" value={steps} min={2} max={8} step={1} onChange={(v) => update({ steps: v })} />
        <p className="mt-3 text-xs text-slate-500">The binomial model builds a tree of up and down moves, then works backward from expiry using risk-neutral probabilities to price the option today. Add more steps and it converges to the Black–Scholes value. Educational tool, not financial advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Call price" value={`$${price.toFixed(2)}`} />
        <Stat label="Up factor u" value={u.toFixed(3)} />
        <Stat label="Risk-neutral p" value={p.toFixed(3)} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
