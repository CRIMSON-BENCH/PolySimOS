"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const CW = 540, CH = 460;

const PRESETS: Record<string, { n: number }> = {
  "Sparse (8)": { n: 8 },
  "Handful (30)": { n: 30 },
  "Dense (60)": { n: 60 },
  "Crowd (120)": { n: 120 },
};

export function ConvexHullStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ n }, update] = useShareableNumbers({ n: 30 });
  const [seed, setSeed] = useState(1);
  const pts = useRef<[number, number][]>([]);
  const [hullSize, setHullSize] = useState(0);

  useEffect(() => {
    let s = seed * 2246822519 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    pts.current = Array.from({ length: Math.round(n) }, () => [40 + rnd() * 460, 40 + rnd() * 380] as [number, number]);
  }, [n, seed]);

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = hidpi(canvas, CW, CH);
    const P = [...pts.current].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower: [number, number][] = []; for (const p of P) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
    const upper: [number, number][] = []; for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
    const hull = lower.slice(0, -1).concat(upper.slice(0, -1)); setHullSize(hull.length);
    ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, CW, CH);
    ctx.beginPath(); hull.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
    ctx.fillStyle = "rgba(34,211,238,0.12)"; ctx.fill(); ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.stroke();
    for (const [x, y] of pts.current) { ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fillStyle = "#e2e8f0"; ctx.fill(); }
    for (const [x, y] of hull) { ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fillStyle = "#f472b6"; ctx.fill(); }
  }, [n, seed]);

  const nRound = Math.round(n);
  const interior = Math.max(nRound - hullSize, 0);
  const explain =
    hullSize === 0
      ? "Add points and a boundary polygon appears — the hull is the smallest convex shape wrapping them all."
      : `Of ${nRound} points, only ${hullSize} lie on the hull while ${interior} sit inside and never touch the boundary — for random points the vertex count grows roughly like log n, far slower than n itself.`;

  const code = `import numpy as np
n = ${nRound}
rng = np.random.default_rng(${seed})
P = rng.uniform([40, 40], [500, 420], size=(n, 2))
P = P[np.lexsort((P[:, 1], P[:, 0]))]
def cross(o, a, b):
    return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])
lower = []
for p in P:
    while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0: lower.pop()
    lower.append(tuple(p))
upper = []
for p in P[::-1]:
    while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0: upper.pop()
    upper.append(tuple(p))
hull = lower[:-1] + upper[:-1]
print("hull vertices", len(hull))`;

  return (
    <StudioChrome title="Convex Hull" tagline="Andrew's monotone chain"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Points" value={n} min={5} max={120} step={1} onChange={(v) => update({ n: v })} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">New points</button>
        <p className="mt-3 text-xs text-slate-500">The convex hull is the smallest convex polygon containing every point — the shape a rubber band snaps to. Computed here with Andrew&apos;s monotone-chain algorithm in O(n log n).</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Points" value={String(nRound)} />
        <Stat label="Hull vertices" value={String(hullSize)} />
        <Stat label="Complexity" value="O(n log n)" />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={540} height={460} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
