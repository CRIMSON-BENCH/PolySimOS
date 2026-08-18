"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const N = 120, CELL = 4;

const PRESETS: Record<string, { growth: number; ignite: number }> = {
  "Rare lightning": { growth: 0.02, ignite: 0.00005 },
  "Storm season": { growth: 0.01, ignite: 0.001 },
  "Old growth": { growth: 0.05, ignite: 0.0001 },
  "Sparse scrub": { growth: 0.003, ignite: 0.0003 },
};

export function ForestFireStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ growth, ignite }, update] = useShareableNumbers({ growth: 0.01, ignite: 0.0002 });
  const [trees, setTrees] = useState(0);
  const grid = useRef<Uint8Array>(new Uint8Array(N * N)); // 0 empty,1 tree,2 fire
  const growthRef = useRef(growth); growthRef.current = growth;
  const igniteRef = useRef(ignite); igniteRef.current = ignite;
  const rngS = useRef(123);

  useEffect(() => { let s = 7; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; for (let i = 0; i < N * N; i++) grid.current[i] = r() < 0.5 ? 1 : 0; }, []);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const growth = growthRef.current, ignite = igniteRef.current;
    const rnd = () => { rngS.current = (rngS.current * 1664525 + 1013904223) >>> 0; return rngS.current / 4294967296; };
    let tc = 0;
    for (let step = 0; step < steps; step++) {
      const g = grid.current; const next = new Uint8Array(N * N); tc = 0;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const i = y * N + x; const c = g[i];
        if (c === 2) next[i] = 0;
        else if (c === 1) {
          let burning = false;
          for (let dy = -1; dy <= 1 && !burning; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; if (g[ny * N + nx] === 2) { burning = true; break; } }
          next[i] = burning || rnd() < ignite ? 2 : 1; if (next[i] === 1) tc++;
        } else next[i] = rnd() < growth ? 1 : 0;
      }
      grid.current = next;
    }
    setTrees(tc);
    const g = grid.current;
    const ctx = hidpi(canvas, N * CELL, N * CELL); ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, N * CELL, N * CELL);
    for (let i = 0; i < N * N; i++) { const v = g[i]; if (!v) continue; ctx.fillStyle = v === 2 ? "#f97316" : "#22c55e"; ctx.fillRect((i % N) * CELL, ((i / N) | 0) * CELL, CELL, CELL); }
  };

  const t = useTransport(frame);

  const ratio = growth / ignite;
  const explain =
    ratio > 500
      ? `With p/f around ${ratio.toFixed(0)}, trees pack in densely between strikes, so one spark can sweep a huge connected cluster — rare but catastrophic fires.`
      : ratio < 50
      ? `With p/f around ${ratio.toFixed(0)}, lightning arrives faster than the forest regrows, so fires stay small and frequent and dense stands never form.`
      : `Near p/f around ${ratio.toFixed(0)} the model sits close to its critical point, where fire sizes span every scale in a power law — the signature of self-organized criticality.`;

  const code = `import numpy as np
N, p, f = ${N}, ${growth}, ${ignite}
g = (np.random.rand(N, N) < 0.5).astype(int)  # 1 = tree, 2 = fire
for step in range(200):
    fire = g == 2
    neigh = np.zeros_like(fire)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            neigh |= np.roll(np.roll(fire, dy, 0), dx, 1)
    nxt = g.copy(); nxt[fire] = 0
    nxt[(g == 1) & (neigh | (np.random.rand(N, N) < f))] = 2
    nxt[(g == 0) & (np.random.rand(N, N) < p)] = 1
    g = nxt
print("living trees", int((g == 1).sum()))`;

  return (
    <StudioChrome title="Forest Fire Model" tagline="self-organized criticality"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} speed={t.speed} onSpeed={t.setSpeed} />
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Growth rate p" value={growth} min={0.001} max={0.05} step={0.001} onChange={(v) => update({ growth: v })} />
        <Slider label="Lightning f" value={ignite} min={0.00001} max={0.001} step={0.00001} onChange={(v) => update({ ignite: v })} />
        <p className="mt-3 text-xs text-slate-500">Trees grow at rate p; lightning ignites one at rate f; fire spreads to neighbors. The ratio p/f self-organizes to a critical state where fire sizes follow a power law — a classic model of self-organized criticality.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Living trees" value={String(trees)} /><Stat label="Grid" value={`${N}²`} /><Stat label="p / f" value={(growth / ignite).toFixed(0)} /><Equation tex={`P(\\text{grow}) = ${growth},\\quad P(\\text{ignite}) = ${ignite},\\quad \\frac{p}{f} = ${(growth / ignite).toFixed(0)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={N * CELL} height={N * CELL} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
