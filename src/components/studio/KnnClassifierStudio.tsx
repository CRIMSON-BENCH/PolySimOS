"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const rnd = (n: number) => ((n * 9301 + 49297) % 233280) / 233280;

const PRESETS: Record<string, { k: number }> = {
  "Overfit (k=1)": { k: 1 },
  "Balanced (k=7)": { k: 7 },
  "Smooth (k=15)": { k: 15 },
  "Very smooth (k=25)": { k: 25 },
};

export function KnnClassifierStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ k }, update] = useShareableNumbers({ k: 5 });
  const pts: { x: number; y: number; c: number }[] = [];
  for (let i = 0; i < 60; i++) { const cls = i % 3; pts.push({ x: rnd(i * 3 + 1) * 0.6 + [0.15, 0.65, 0.4][cls], y: rnd(i * 7 + 2) * 0.6 + [0.15, 0.2, 0.7][cls], c: cls }); }
  const cols = ["#22d3ee", "#f472b6", "#a3e635"];

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const gx = 60, gy = 40, gw = W - 100, gh = H - 70, res = 24;
    for (let i = 0; i < res; i++) for (let j = 0; j < res; j++) { const x = i / res, y = j / res; const dists = pts.map(p => ({ d: (p.x - x) ** 2 + (p.y - y) ** 2, c: p.c })).sort((a, b) => a.d - b.d).slice(0, k); const votes = [0, 0, 0]; dists.forEach(d => votes[d.c]++); const cls = votes.indexOf(Math.max(...votes)); ctx.fillStyle = cols[cls] + "22"; ctx.fillRect(gx + x * gw, gy + y * gh, gw / res + 1, gh / res + 1); }
    pts.forEach(p => { ctx.fillStyle = cols[p.c]; ctx.beginPath(); ctx.arc(gx + p.x * gw, gy + p.y * gh, 4, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`k-NN decision regions (k = ${k})`, 12, 20);
  }, [k]);

  const explain =
    k <= 3
      ? `With k = ${k} each vote is decided by only a handful of neighbors, so the boundary chases individual points — low bias but high variance, the classic overfit signature.`
      : k >= 15
      ? `With k = ${k} the vote averages over many neighbors, giving a smooth, stable boundary — but so much smoothing can swallow small real clusters (high bias).`
      : `k = ${k} sits in the sweet spot: enough neighbors to shrug off noise, few enough to keep the true boundary shape.`;

  const code = `import numpy as np
from collections import Counter
k = ${k}
def knn(train_X, train_y, x):
    d = np.sum((train_X - x) ** 2, axis=1)
    idx = np.argsort(d)[:k]
    return Counter(train_y[idx]).most_common(1)[0][0]
# smaller k -> jagged/overfit, larger k -> smoother boundary`;

  return (
    <StudioChrome title="k-Nearest Neighbors" tagline="classify by your neighbors"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Neighbors k" value={k} min={1} max={25} step={1} onChange={(v) => update({ k: v })} />
        <p className="mt-3 text-xs text-slate-500">k-NN classifies a point by majority vote of its k nearest labeled neighbors. Small k gives jagged, overfit boundaries that chase noise; large k smooths them out but can blur real structure. It is the simplest possible classifier — no training at all. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Neighbors" value={`${k}`} />
        <Stat label="Boundary" value={k <= 3 ? "jagged (overfit)" : k >= 15 ? "very smooth" : "balanced"} />
        <Equation tex={`\\hat y = \\operatorname{mode}\\{\\, y_i : x_i \\in N_{${k}}(x) \\,\\}, \\quad d(x, x_i) = \\lVert x - x_i \\rVert`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
