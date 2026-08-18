"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { useShareableNumbers } from "@/lib/studioKit";

const ITEMS = [
  { name: "Camera", w: 4, v: 500 }, { name: "Laptop", w: 8, v: 700 }, { name: "Water", w: 3, v: 200 },
  { name: "Tent", w: 10, v: 400 }, { name: "Food", w: 5, v: 300 }, { name: "Book", w: 2, v: 90 },
  { name: "Radio", w: 6, v: 260 }, { name: "Rope", w: 3, v: 130 },
];

const PRESETS: Record<string, { cap: number }> = {
  "Tiny (8 kg)": { cap: 8 },
  "Day pack (15 kg)": { cap: 15 },
  "Standard (25 kg)": { cap: 25 },
  "Expedition (38 kg)": { cap: 38 },
};

export function KnapsackStudio() {
  const [{ cap }, update] = useShareableNumbers({ cap: 20 });

  const N = ITEMS.length; const C = Math.round(cap);
  const dp: number[][] = Array.from({ length: N + 1 }, () => new Array(C + 1).fill(0));
  for (let i = 1; i <= N; i++) for (let w = 0; w <= C; w++) { dp[i][w] = dp[i - 1][w]; if (ITEMS[i - 1].w <= w) dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - ITEMS[i - 1].w] + ITEMS[i - 1].v); }
  const chosen = new Set<number>(); let w = C; for (let i = N; i >= 1; i--) { if (dp[i][w] !== dp[i - 1][w]) { chosen.add(i - 1); w -= ITEMS[i - 1].w; } }
  const totW = [...chosen].reduce((a, i) => a + ITEMS[i].w, 0); const totV = dp[N][C];

  const explain =
    chosen.size === 0
      ? "The capacity is too small to fit any single item — raise it to start packing."
      : totW < C
      ? `The optimal pack is worth $${totV} using only ${totW} of ${C} kg — the leftover ${C - totW} kg stays empty because no unpacked item fits without displacing something more valuable.`
      : `DP fills all ${C} kg for $${totV}; notice the best pack is not simply the highest-value items — it trades value against weight, which is exactly why greedy selection fails here.`;

  const code = `items = [${ITEMS.map((it) => `(${it.w}, ${it.v})`).join(", ")}]  # (weight, value)
C = ${C}
dp = [[0]*(C+1) for _ in range(len(items)+1)]
for i in range(1, len(items)+1):
    w_i, v_i = items[i-1]
    for cap in range(C+1):
        dp[i][cap] = dp[i-1][cap]
        if w_i <= cap:
            dp[i][cap] = max(dp[i][cap], dp[i-1][cap-w_i] + v_i)
print("best value", dp[len(items)][C])`;

  return (
    <StudioChrome title="0/1 Knapsack" tagline="dynamic programming optimization"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Backpack capacity (kg)" value={cap} min={5} max={40} step={1} onChange={(v) => update({ cap: v })} />
        <p className="mt-3 text-xs text-slate-500">The knapsack problem: pick items to maximize value without exceeding a weight limit. Greedily grabbing the most valuable item fails; the optimal answer needs dynamic programming, which builds a table of best values for every capacity. It models budgeting, cargo loading, and resource allocation — and is a classic NP-hard problem solved efficiently by DP.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Total value" value={`$${totV}`} /><Stat label="Weight used" value={`${totW} / ${C} kg`} /><Stat label="Items packed" value={String(chosen.size)} /><ExplainResult text={explain} /></div>}
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
