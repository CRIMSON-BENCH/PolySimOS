"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

type Leg = { type: "call" | "put"; qty: number; strike: number; premium: number };
const STRATS: Record<string, (k: number) => Leg[]> = {
  "Long call": (k) => [{ type: "call", qty: 1, strike: k, premium: 5 }],
  "Long put": (k) => [{ type: "put", qty: 1, strike: k, premium: 5 }],
  "Covered call": (k) => [{ type: "call", qty: -1, strike: k + 10, premium: 4 }],
  "Straddle": (k) => [{ type: "call", qty: 1, strike: k, premium: 5 }, { type: "put", qty: 1, strike: k, premium: 5 }],
  "Bull call spread": (k) => [{ type: "call", qty: 1, strike: k - 5, premium: 8 }, { type: "call", qty: -1, strike: k + 5, premium: 3 }],
  "Iron condor": (k) => [{ type: "put", qty: 1, strike: k - 15, premium: 1 }, { type: "put", qty: -1, strike: k - 5, premium: 3 }, { type: "call", qty: -1, strike: k + 5, premium: 3 }, { type: "call", qty: 1, strike: k + 15, premium: 1 }],
};

export function OptionPayoffStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strat, setStrat] = useState("Bull call spread");
  const [K, setK] = useState(100);

  const legs = STRATS[strat](K);
  const payoff = (S: number) => legs.reduce((sum, l) => { const intr = l.type === "call" ? Math.max(0, S - l.strike) : Math.max(0, l.strike - S); return sum + l.qty * (intr - l.premium); }, 0);

  let maxProfit = -Infinity, maxLoss = Infinity;
  for (let s = 0; s <= 200; s += 0.5) { const p = payoff(s); maxProfit = Math.max(maxProfit, p); maxLoss = Math.min(maxLoss, p); }

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 340; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, cy = H / 2, pw = W - 70, sMax = 200;
    let pmax = 1; for (let s = 0; s <= sMax; s += 2) pmax = Math.max(pmax, Math.abs(payoff(s))); const scale = (H / 2 - 30) / pmax;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, cy); ctx.lineTo(ox + pw, cy); ctx.moveTo(ox, 20); ctx.lineTo(ox, H - 20); ctx.stroke();
    // zones
    ctx.beginPath(); ctx.moveTo(ox, cy); for (let i = 0; i <= pw; i++) { const sv = (i / pw) * sMax; ctx.lineTo(ox + i, cy - payoff(sv) * scale); } ctx.lineTo(ox + pw, cy); ctx.closePath(); ctx.fillStyle = "rgba(34,211,238,0.1)"; ctx.fill();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const sv = (i / pw) * sMax; const y = cy - payoff(sv) * scale; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("profit", ox + 4, 30); ctx.fillText("loss", ox + 4, H - 24); ctx.fillText("underlying at expiry →", ox + pw - 120, cy + 16);
  }, [strat, K]);

  return (
    <StudioChrome title="Option Strategy Payoff" tagline="profit/loss at expiry"
      controls={<div>
        <div className="mb-3 grid grid-cols-2 gap-2">{Object.keys(STRATS).map((s) => <button key={s} onClick={() => setStrat(s)} className={`rounded-lg px-2 py-1 text-xs font-semibold ${strat === s ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{s}</button>)}</div>
        <Slider label="Center strike" value={K} min={60} max={140} step={1} onChange={setK} />
        <p className="mt-3 text-xs text-slate-500">An option strategy&apos;s payoff diagram plots profit or loss against the underlying price at expiration. Combining calls and puts at different strikes shapes the curve — capping risk, capturing volatility, or generating income. Educational tool, not investment advice.</p>
      </div>}
      inspector={<div><Stat label="Max profit" value={maxProfit > 900 ? "unlimited" : `$${maxProfit.toFixed(2)}`} /><Stat label="Max loss" value={maxLoss < -900 ? "unlimited" : `$${maxLoss.toFixed(2)}`} /><Stat label="Legs" value={String(legs.length)} /></div>}
    ><canvas ref={canvasRef} width={520} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
