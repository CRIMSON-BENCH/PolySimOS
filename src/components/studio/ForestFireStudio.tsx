"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const N = 120, CELL = 4;

export function ForestFireStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [growth, setGrowth] = useState(0.01);
  const [ignite, setIgnite] = useState(0.0002);
  const [running, setRunning] = useState(true);
  const [trees, setTrees] = useState(0);
  const grid = useRef<Uint8Array>(new Uint8Array(N * N)); // 0 empty,1 tree,2 fire

  useEffect(() => { let s = 7; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; for (let i = 0; i < N * N; i++) grid.current[i] = r() < 0.5 ? 1 : 0; }, []);

  useEffect(() => {
    if (!running) return; let raf = 0; let s = 123;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const loop = () => {
      const g = grid.current; const next = new Uint8Array(N * N); let tc = 0;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const i = y * N + x; const c = g[i];
        if (c === 2) next[i] = 0;
        else if (c === 1) {
          let burning = false;
          for (let dy = -1; dy <= 1 && !burning; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; if (g[ny * N + nx] === 2) { burning = true; break; } }
          next[i] = burning || rnd() < ignite ? 2 : 1; if (next[i] === 1) tc++;
        } else next[i] = rnd() < growth ? 1 : 0;
        if (next[i] === 1) {}
      }
      grid.current = next; setTrees(tc);
      const ctx = canvasRef.current!.getContext("2d")!; ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, N * CELL, N * CELL);
      for (let i = 0; i < N * N; i++) { const v = next[i]; if (!v) continue; ctx.fillStyle = v === 2 ? "#f97316" : "#22c55e"; ctx.fillRect((i % N) * CELL, ((i / N) | 0) * CELL, CELL, CELL); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, growth, ignite]);

  return (
    <StudioChrome title="Forest Fire Model" tagline="self-organized criticality"
      controls={<div>
        <Slider label="Growth rate p" value={growth} min={0.001} max={0.05} step={0.001} onChange={setGrowth} />
        <Slider label="Lightning f" value={ignite} min={0.00001} max={0.001} step={0.00001} onChange={setIgnite} />
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">Trees grow at rate p; lightning ignites one at rate f; fire spreads to neighbors. The ratio p/f self-organizes to a critical state where fire sizes follow a power law — a classic model of self-organized criticality.</p>
      </div>}
      inspector={<div><Stat label="Living trees" value={String(trees)} /><Stat label="Grid" value={`${N}²`} /><Stat label="p / f" value={(growth / ignite).toFixed(0)} /></div>}
    ><canvas ref={canvasRef} width={N * CELL} height={N * CELL} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
