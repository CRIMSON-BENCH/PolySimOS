"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const N = 80, CELL = 6;

const PRESETS: Record<string, { tolerance: number; empty: number }> = {
  "Tolerant (30%)": { tolerance: 0.3, empty: 0.1 },
  "Mild bias (40%)": { tolerance: 0.4, empty: 0.1 },
  "Picky (55%)": { tolerance: 0.55, empty: 0.15 },
  "Sparse city": { tolerance: 0.4, empty: 0.25 },
};

export function SchellingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ tolerance, empty }, update] = useShareableNumbers({ tolerance: 0.35, empty: 0.1 });
  const [seed, setSeed] = useState(1);
  const [happy, setHappy] = useState(0);
  const grid = useRef<Int8Array>(new Int8Array(N * N)); // -1 empty, 0/1 groups
  const tolRef = useRef(tolerance); tolRef.current = tolerance;
  const rngS = useRef(55);

  useEffect(() => { let s = seed * 104729 >>> 0; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let i = 0; i < N * N; i++) grid.current[i] = r() < empty ? -1 : (r() < 0.5 ? 0 : 1); }, [seed, empty]);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tolerance = tolRef.current;
    const rnd = () => { rngS.current = (rngS.current * 1664525 + 1013904223) >>> 0; return rngS.current / 4294967296; };
    const contentAt = (g: Int8Array, i: number) => { const x = i % N, y = (i / N) | 0; const me = g[i]; if (me < 0) return true; let same = 0, tot = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const v = g[ny * N + nx]; if (v < 0) continue; tot++; if (v === me) same++; }
      return tot === 0 ? true : same / tot >= tolerance; };
    let happyCount = 0, occupied = 0;
    for (let step = 0; step < steps; step++) {
      const g = grid.current; const empties: number[] = []; for (let i = 0; i < N * N; i++) if (g[i] < 0) empties.push(i);
      happyCount = 0; occupied = 0;
      for (let i = 0; i < N * N; i++) { if (g[i] < 0) continue; occupied++; if (contentAt(g, i)) { happyCount++; continue; }
        if (empties.length) { const e = empties[(rnd() * empties.length) | 0]; g[e] = g[i]; g[i] = -1; empties[empties.indexOf(e)] = i; } }
    }
    setHappy(occupied ? happyCount / occupied : 0);
    const g = grid.current;
    const ctx = hidpi(canvas, N * CELL, N * CELL); ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, N * CELL, N * CELL);
    for (let i = 0; i < N * N; i++) { const v = g[i]; if (v < 0) continue; ctx.fillStyle = v === 0 ? "#22d3ee" : "#f472b6"; ctx.fillRect((i % N) * CELL, ((i / N) | 0) * CELL, CELL - 1, CELL - 1); }
  };

  const t = useTransport(frame);

  const explain = tolerance <= 0.3
    ? `A ${(tolerance * 100).toFixed(0)}% similarity wish is low, so neighborhoods stay largely mixed — mild preferences alone rarely tip the grid.`
    : tolerance >= 0.55
    ? `A ${(tolerance * 100).toFixed(0)}% demand is high: agents seldom settle, so the grid churns toward sharply segregated blocks.`
    : `Even a moderate ${(tolerance * 100).toFixed(0)}% preference drives global segregation — Schelling's core surprise — with ${happy > 0 ? `${(happy * 100).toFixed(0)}% currently content` : "the grid still settling"}.`;

  const code = `import numpy as np
N, tol, empty = ${N}, ${tolerance}, ${empty}
g = np.where(np.random.rand(N, N) < empty, -1,
             (np.random.rand(N, N) < 0.5).astype(int))
# each occupied cell is happy if >= tol of its 8 neighbors match;
# unhappy agents relocate to a random empty cell until few remain.
print("similarity threshold", tol, "empty fraction", empty)`;

  return (
    <StudioChrome title="Schelling Segregation" tagline="emergent segregation from mild bias"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { setSeed((n) => n + 1); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Similarity wanted" value={tolerance} min={0.1} max={0.75} step={0.05} onChange={(v) => update({ tolerance: v })} />
        <Slider label="Empty fraction" value={empty} min={0.05} max={0.3} step={0.05} onChange={(v) => update({ empty: v })} />
        <p className="mt-3 text-xs text-slate-500">Each agent is happy if at least this fraction of its neighbors share its color; unhappy agents move to a random empty cell. Even a mild preference for similar neighbors drives sharp, global segregation — Schelling&apos;s famous result.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Happy" value={`${(happy * 100).toFixed(1)}%`} /><Stat label="Threshold" value={`${(tolerance * 100).toFixed(0)}%`} /><Stat label="Grid" value={`${N}²`} /><Equation tex={`\\text{move if}\\quad \\frac{n_{\\text{like}}}{n_{\\text{total}}} < \\tau = ${tolerance.toFixed(2)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={N * CELL} height={N * CELL} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
