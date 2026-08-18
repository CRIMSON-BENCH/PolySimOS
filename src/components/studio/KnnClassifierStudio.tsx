"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const rnd = (n: number) => ((n * 9301 + 49297) % 233280) / 233280;

export function KnnClassifierStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [k, setK] = useState(5);
  const pts: { x: number; y: number; c: number }[] = [];
  for (let i = 0; i < 60; i++) { const cls = i % 3; pts.push({ x: rnd(i * 3 + 1) * 0.6 + [0.15, 0.65, 0.4][cls], y: rnd(i * 7 + 2) * 0.6 + [0.15, 0.2, 0.7][cls], c: cls }); }
  const cols = ["#22d3ee", "#f472b6", "#a3e635"];

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const gx = 60, gy = 40, gw = W - 100, gh = H - 70, res = 24;
    for (let i = 0; i < res; i++) for (let j = 0; j < res; j++) { const x = i / res, y = j / res; const dists = pts.map(p => ({ d: (p.x - x) ** 2 + (p.y - y) ** 2, c: p.c })).sort((a, b) => a.d - b.d).slice(0, k); const votes = [0, 0, 0]; dists.forEach(d => votes[d.c]++); const cls = votes.indexOf(Math.max(...votes)); ctx.fillStyle = cols[cls] + "22"; ctx.fillRect(gx + x * gw, gy + y * gh, gw / res + 1, gh / res + 1); }
    pts.forEach(p => { ctx.fillStyle = cols[p.c]; ctx.beginPath(); ctx.arc(gx + p.x * gw, gy + p.y * gh, 4, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`k-NN decision regions (k = ${k})`, 12, 20);
  }, [k]);

  return (
    <StudioChrome title="k-Nearest Neighbors" tagline="classify by your neighbors"
      controls={<div>
        <Slider label="Neighbors k" value={k} min={1} max={25} step={1} onChange={setK} />
        <p className="mt-3 text-xs text-slate-500">k-NN classifies a point by majority vote of its k nearest labeled neighbors. Small k gives jagged, overfit boundaries that chase noise; large k smooths them out but can blur real structure. It is the simplest possible classifier — no training at all. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Neighbors" value={`${k}`} />
        <Stat label="Boundary" value={k <= 3 ? "jagged (overfit)" : k >= 15 ? "very smooth" : "balanced"} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
