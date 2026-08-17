"use client";

import { useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const ITEMS = [
  { name: "Camera", w: 4, v: 500 }, { name: "Laptop", w: 8, v: 700 }, { name: "Water", w: 3, v: 200 },
  { name: "Tent", w: 10, v: 400 }, { name: "Food", w: 5, v: 300 }, { name: "Book", w: 2, v: 90 },
  { name: "Radio", w: 6, v: 260 }, { name: "Rope", w: 3, v: 130 },
];

export function KnapsackStudio() {
  const [cap, setCap] = useState(20);

  const N = ITEMS.length; const C = Math.round(cap);
  const dp: number[][] = Array.from({ length: N + 1 }, () => new Array(C + 1).fill(0));
  for (let i = 1; i <= N; i++) for (let w = 0; w <= C; w++) { dp[i][w] = dp[i - 1][w]; if (ITEMS[i - 1].w <= w) dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - ITEMS[i - 1].w] + ITEMS[i - 1].v); }
  const chosen = new Set<number>(); let w = C; for (let i = N; i >= 1; i--) { if (dp[i][w] !== dp[i - 1][w]) { chosen.add(i - 1); w -= ITEMS[i - 1].w; } }
  const totW = [...chosen].reduce((a, i) => a + ITEMS[i].w, 0); const totV = dp[N][C];

  return (
    <StudioChrome title="0/1 Knapsack" tagline="dynamic programming optimization"
      controls={<div>
        <Slider label="Backpack capacity (kg)" value={cap} min={5} max={40} step={1} onChange={setCap} />
        <p className="mt-3 text-xs text-slate-500">The knapsack problem: pick items to maximize value without exceeding a weight limit. Greedily grabbing the most valuable item fails; the optimal answer needs dynamic programming, which builds a table of best values for every capacity. It models budgeting, cargo loading, and resource allocation — and is a classic NP-hard problem solved efficiently by DP.</p>
      </div>}
      inspector={<div><Stat label="Total value" value={`$${totV}`} /><Stat label="Weight used" value={`${totW} / ${C} kg`} /><Stat label="Items packed" value={String(chosen.size)} /></div>}
    ><div className="grid grid-cols-2 gap-3 p-2 sm:grid-cols-4">
        {ITEMS.map((it, i) => (
          <div key={it.name} className={`rounded-xl border p-3 text-center ${chosen.has(i) ? "border-cyan-400 bg-cyan-500/15" : "border-slate-700 bg-slate-900/50 opacity-50"}`}>
            <div className="text-sm font-semibold text-slate-100">{it.name}</div>
            <div className="mt-1 text-xs text-slate-400">{it.w} kg</div>
            <div className="text-sm font-bold text-cyan-300">${it.v}</div>
            <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">{chosen.has(i) ? "packed" : "left"}</div>
          </div>
        ))}
      </div></StudioChrome>
  );
}
