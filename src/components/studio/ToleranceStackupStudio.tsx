"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { nParts: number; tol: number }> = {
  "5 parts, ±0.1": { nParts: 5, tol: 0.1 },
  "Long chain": { nParts: 12, tol: 0.05 },
  "Loose tolerance": { nParts: 4, tol: 0.5 },
  "Tight precision": { nParts: 8, tol: 0.02 },
};

export function ToleranceStackupStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ nParts, tol }, update] = useShareableNumbers({ nParts: 5, tol: 0.1 });

  const N = Math.round(nParts); const worstCase = N * tol; const rss = Math.sqrt(N) * tol;

  useEffect(() => {
    const W = 500, H = 260; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 30, cy = 90; let x = ox;
    for (let i = 0; i < N; i++) { const w = (W - 60) / N; ctx.fillStyle = "#334155"; ctx.fillRect(x, cy - 20, w - 4, 40); ctx.strokeStyle = "#22d3ee"; ctx.strokeRect(x, cy - 20, w - 4, 40); ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText(`±${tol}`, x + w / 2 - 12, cy + 4); x += w; }
    ctx.fillStyle = "#e2e8f0"; ctx.font = "11px sans-serif"; ctx.fillText(`${N} stacked parts`, ox, cy - 32);
    // bars comparing worst-case vs RSS
    const by = 180; const scale = 200 / worstCase;
    ctx.fillStyle = "#f472b6"; ctx.fillRect(ox, by, worstCase * scale, 20); ctx.fillStyle = "#a3e635"; ctx.fillRect(ox, by + 30, rss * scale, 20);
    ctx.fillStyle = "#f9a8d4"; ctx.fillText(`worst case ±${worstCase.toFixed(2)}`, ox + worstCase * scale + 6, by + 15); ctx.fillStyle = "#bef264"; ctx.fillText(`statistical (RSS) ±${rss.toFixed(2)}`, ox + rss * scale + 6, by + 45);
  }, [nParts, tol]);

  const tighter = (1 - rss / worstCase) * 100;
  const explain =
    N >= 8
      ? `With ${N} parts stacked, worst-case adds every tolerance to ±${worstCase.toFixed(2)} mm, but RSS holds the realistic spread to ±${rss.toFixed(2)} mm — ${tighter.toFixed(0)}% tighter, since all parts hitting their limit at once is vanishingly rare.`
      : N <= 3
      ? `Only ${N} parts means little accumulates: worst-case ±${worstCase.toFixed(2)} mm and RSS ±${rss.toFixed(2)} mm are close, so the statistical shortcut buys you little here.`
      : `Across ${N} parts, RSS (±${rss.toFixed(2)} mm) is ${tighter.toFixed(0)}% tighter than the worst-case ±${worstCase.toFixed(2)} mm — enough headroom to relax individual part tolerances and cut cost.`;

  const code = `import math
n_parts, tol = ${N}, ${tol}
worst_case = n_parts * tol
rss = math.sqrt(n_parts) * tol
print("worst-case ±", round(worst_case, 3), "mm")
print("statistical (RSS) ±", round(rss, 3), "mm")
print("RSS tighter by", round((1 - rss / worst_case) * 100), "%")`;

  return (
    <StudioChrome title="Tolerance Stack-Up" tagline="worst-case vs statistical"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Number of parts" value={nParts} min={2} max={12} step={1} onChange={(v) => update({ nParts: v })} />
        <Slider label="Tolerance per part (±mm)" value={tol} min={0.01} max={0.5} step={0.01} onChange={(v) => update({ tol: v })} />
        <p className="mt-3 text-xs text-slate-500">When parts stack in an assembly, their tolerances accumulate. Worst-case analysis simply adds them — safe but pessimistic, since all parts rarely hit their extremes together. Statistical (root-sum-square) analysis adds them in quadrature, giving a much tighter, more realistic range. Choosing between them decides how much precision — and cost — each part really needs.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Worst-case total" value={`±${worstCase.toFixed(2)} mm`} /><Stat label="Statistical (RSS)" value={`±${rss.toFixed(2)} mm`} /><Stat label="RSS savings" value={`${tighter.toFixed(0)}% tighter`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={260} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
