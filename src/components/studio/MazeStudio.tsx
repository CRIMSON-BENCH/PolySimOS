"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { size: number }> = {
  "Tiny (10)": { size: 10 },
  "Classic (25)": { size: 25 },
  "Large (32)": { size: 32 },
  "Dense (40)": { size: 40 },
};

export function MazeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ size }, update] = useShareableNumbers({ size: 25 });
  const [seed, setSeed] = useState(1);
  const [solve, setSolve] = useState(true);

  useEffect(() => {
    const N = Math.round(size); const CELL = Math.floor(560 / N);
    const CW = 600, CH = 600;
    const canvas = canvasRef.current!; const ctx = hidpi(canvas, CW, CH);
    // deterministic PRNG seeded by `seed`
    let s = seed * 2654435761 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    // walls[i] = {N,E,S,W} present
    const wall = new Array(N * N).fill(0).map(() => ({ n: true, e: true, s: true, w: true }));
    const seen = new Array(N * N).fill(false);
    const stack = [0]; seen[0] = true;
    while (stack.length) {
      const c = stack[stack.length - 1]; const x = c % N, y = (c / N) | 0;
      const opts: [number, string, string][] = [];
      if (y > 0 && !seen[c - N]) opts.push([c - N, "n", "s"]);
      if (x < N - 1 && !seen[c + 1]) opts.push([c + 1, "e", "w"]);
      if (y < N - 1 && !seen[c + N]) opts.push([c + N, "s", "n"]);
      if (x > 0 && !seen[c - 1]) opts.push([c - 1, "w", "e"]);
      if (!opts.length) { stack.pop(); continue; }
      const [nx, a, b] = opts[(rnd() * opts.length) | 0];
      (wall[c] as Record<string, boolean>)[a] = false; (wall[nx] as Record<string, boolean>)[b] = false; seen[nx] = true; stack.push(nx);
    }
    // BFS solve from 0 to N*N-1
    const path: number[] = [];
    if (solve) {
      const q = [0]; const prev = new Map<number, number>([[0, -1]]);
      while (q.length) { const c = q.shift()!; if (c === N * N - 1) break; const x = c % N, y = (c / N) | 0; const w = wall[c];
        const mv: [boolean, number][] = [[!w.n, c - N], [!w.e, c + 1], [!w.s, c + N], [!w.w, c - 1]];
        for (const [ok, ni] of mv) { if (ok && !prev.has(ni)) { prev.set(ni, c); q.push(ni); } } }
      let c = N * N - 1; while (c !== undefined && c !== -1) { path.push(c); c = prev.get(c)!; }
    }
    ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, CW, CH);
    const OX = (CW - N * CELL) / 2, OY = (CH - N * CELL) / 2;
    if (solve) { ctx.strokeStyle = "#a3e635"; ctx.lineWidth = Math.max(2, CELL * 0.35); ctx.lineJoin = "round"; ctx.beginPath();
      path.forEach((c, i) => { const px = OX + (c % N) * CELL + CELL / 2, py = OY + ((c / N) | 0) * CELL + CELL / 2; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }); ctx.stroke(); }
    ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1.5;
    for (let i = 0; i < N * N; i++) { const x = OX + (i % N) * CELL, y = OY + ((i / N) | 0) * CELL; const w = wall[i]; ctx.beginPath();
      if (w.n) { ctx.moveTo(x, y); ctx.lineTo(x + CELL, y); } if (w.e) { ctx.moveTo(x + CELL, y); ctx.lineTo(x + CELL, y + CELL); }
      if (w.s) { ctx.moveTo(x, y + CELL); ctx.lineTo(x + CELL, y + CELL); } if (w.w) { ctx.moveTo(x, y); ctx.lineTo(x, y + CELL); } ctx.stroke(); }
  }, [size, seed, solve]);

  const cells = Math.round(size) ** 2;
  const explain =
    size <= 14
      ? `Small grids solve almost instantly — with only ${cells} cells the single valid route is short and easy to trace by eye.`
      : size >= 34
      ? `At ${cells} cells the backtracker carves long, twisting corridors, yet BFS still guarantees the shortest route through the one solution.`
      : `A perfect maze has exactly one path between any two cells, so BFS from corner to corner always finds it — here across ${cells} cells.`;

  const code = `# perfect maze via recursive backtracker (N x N)
import random
N, seed = ${Math.round(size)}, ${seed}
random.seed(seed)
wall = [[True]*4 for _ in range(N*N)]        # per cell: N, E, S, W
seen = [False]*(N*N); stack = [0]; seen[0] = True
while stack:
    c = stack[-1]; x, y = c % N, c // N; opt = []
    if y > 0     and not seen[c-N]: opt.append((c-N, 0, 2))
    if x < N-1   and not seen[c+1]: opt.append((c+1, 1, 3))
    if y < N-1   and not seen[c+N]: opt.append((c+N, 2, 0))
    if x > 0     and not seen[c-1]: opt.append((c-1, 3, 1))
    if not opt: stack.pop(); continue
    nx, a, b = random.choice(opt)
    wall[c][a] = wall[nx][b] = False; seen[nx] = True; stack.append(nx)
print("carved", N*N, "cells")`;

  return (
    <StudioChrome title="Maze Generator & Solver" tagline="recursive backtracker · BFS solve"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Grid size" value={size} min={10} max={40} step={1} onChange={(v) => update({ size: v })} />
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" checked={solve} onChange={(e) => setSolve(e.target.checked)} /> Show solution path</label>
        <button onClick={() => setSeed((n) => n + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">New maze</button>
        <p className="mt-3 text-xs text-slate-500">A perfect maze (exactly one path between any two cells) carved by depth-first backtracking, then solved top-left to bottom-right with breadth-first search.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Cells" value={`${Math.round(size)}²`} /><Stat label="Algorithm" value="DFS carve" /><Stat label="Solver" value="BFS shortest" /><Equation tex={`\\text{perfect maze}=\\text{spanning tree}:\\ E=N^2-1=${Math.round(size)}^2-1=${cells - 1}\\ \\text{passages}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={600} height={600} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
