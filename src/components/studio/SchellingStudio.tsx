"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const N = 80, CELL = 6;

export function SchellingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tolerance, setTolerance] = useState(0.35);
  const [empty, setEmpty] = useState(0.1);
  const [running, setRunning] = useState(true);
  const [seed, setSeed] = useState(1);
  const [happy, setHappy] = useState(0);
  const grid = useRef<Int8Array>(new Int8Array(N * N)); // -1 empty, 0/1 groups

  useEffect(() => { let s = seed * 104729 >>> 0; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let i = 0; i < N * N; i++) grid.current[i] = r() < empty ? -1 : (r() < 0.5 ? 0 : 1); }, [seed, empty]);

  useEffect(() => {
    if (!running) return; let raf = 0; let s = 55;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const contentAt = (g: Int8Array, i: number) => { const x = i % N, y = (i / N) | 0; const me = g[i]; if (me < 0) return true; let same = 0, tot = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const v = g[ny * N + nx]; if (v < 0) continue; tot++; if (v === me) same++; }
      return tot === 0 ? true : same / tot >= tolerance; };
    const loop = () => {
      const g = grid.current; const empties: number[] = []; for (let i = 0; i < N * N; i++) if (g[i] < 0) empties.push(i);
      let happyCount = 0, occupied = 0;
      for (let i = 0; i < N * N; i++) { if (g[i] < 0) continue; occupied++; if (contentAt(g, i)) { happyCount++; continue; }
        if (empties.length) { const e = empties[(rnd() * empties.length) | 0]; g[e] = g[i]; g[i] = -1; empties[empties.indexOf(e)] = i; } }
      setHappy(occupied ? happyCount / occupied : 0);
      const ctx = hidpi(canvasRef.current!, N * CELL, N * CELL); ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, N * CELL, N * CELL);
      for (let i = 0; i < N * N; i++) { const v = g[i]; if (v < 0) continue; ctx.fillStyle = v === 0 ? "#22d3ee" : "#f472b6"; ctx.fillRect((i % N) * CELL, ((i / N) | 0) * CELL, CELL - 1, CELL - 1); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, tolerance]);

  return (
    <StudioChrome title="Schelling Segregation" tagline="emergent segregation from mild bias"
      controls={<div>
        <Slider label="Similarity wanted" value={tolerance} min={0.1} max={0.75} step={0.05} onChange={setTolerance} />
        <Slider label="Empty fraction" value={empty} min={0.05} max={0.3} step={0.05} onChange={setEmpty} />
        <div className="mt-3 flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={() => setSeed((n) => n + 1)} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reshuffle</button></div>
        <p className="mt-3 text-xs text-slate-500">Each agent is happy if at least this fraction of its neighbors share its color; unhappy agents move to a random empty cell. Even a mild preference for similar neighbors drives sharp, global segregation — Schelling&apos;s famous result.</p>
      </div>}
      inspector={<div><Stat label="Happy" value={`${(happy * 100).toFixed(1)}%`} /><Stat label="Threshold" value={`${(tolerance * 100).toFixed(0)}%`} /><Stat label="Grid" value={`${N}²`} /></div>}
    ><canvas ref={canvasRef} width={N * CELL} height={N * CELL} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
