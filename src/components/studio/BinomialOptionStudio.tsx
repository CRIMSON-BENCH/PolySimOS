"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function BinomialOptionStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [S, setS] = useState(100), [K, setK] = useState(100), [vol, setVol] = useState(0.25), [T, setT] = useState(1), [steps, setSteps] = useState(4);
  const dt = T / steps, u = Math.exp(vol * Math.sqrt(dt)), d = 1 / u, p = (Math.exp(0.04 * dt) - d) / (u - d);
  // price via backward induction (European call)
  const payoff: number[] = []; for (let j = 0; j <= steps; j++) payoff[j] = Math.max(0, S * Math.pow(u, j) * Math.pow(d, steps - j) - K);
  const vals = payoff.slice(); for (let n = steps - 1; n >= 0; n--) for (let j = 0; j <= n; j++) vals[j] = Math.exp(-0.04 * dt) * (p * vals[j + 1] + (1 - p) * vals[j]);
  const price = vals[0];

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H / 2, dx = (W - 80) / steps, dy = 26;
    for (let n = 0; n <= steps; n++) for (let j = 0; j <= n; j++) { const x = ox + n * dx, y = oy - (n - 2 * j) * dy; if (n < steps) { ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y - dy); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke(); } }
    for (let n = 0; n <= steps; n++) for (let j = 0; j <= n; j++) { const x = ox + n * dx, y = oy - (n - 2 * j) * dy; const price = S * Math.pow(u, j) * Math.pow(d, n - j); ctx.fillStyle = price > K ? "#22d3ee" : "#64748b"; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("binomial price tree — cyan nodes finish in-the-money", 12, 20);
  }, [S, K, vol, T, steps, u, d]);

  return (
    <StudioChrome title="Binomial Option Pricing" tagline="a lattice of possible futures"
      controls={<div>
        <Slider label="Spot price S" value={S} min={50} max={150} step={1} onChange={setS} />
        <Slider label="Strike K" value={K} min={50} max={150} step={1} onChange={setK} />
        <Slider label="Volatility σ" value={vol} min={0.05} max={0.8} step={0.01} onChange={setVol} />
        <Slider label="Time to expiry (yr)" value={T} min={0.1} max={2} step={0.1} onChange={setT} />
        <Slider label="Tree steps" value={steps} min={2} max={8} step={1} onChange={setSteps} />
        <p className="mt-3 text-xs text-slate-500">The binomial model builds a tree of up and down moves, then works backward from expiry using risk-neutral probabilities to price the option today. Add more steps and it converges to the Black–Scholes value. Educational tool, not financial advice.</p>
      </div>}
      inspector={<div>
        <Stat label="Call price" value={`$${price.toFixed(2)}`} />
        <Stat label="Up factor u" value={u.toFixed(3)} />
        <Stat label="Risk-neutral p" value={p.toFixed(3)} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
