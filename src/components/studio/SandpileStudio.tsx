"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const N = 101, CELL = 5;
const COLORS = ["#0b1220", "#1e3a8a", "#0891b2", "#a3e635"];

export function SandpileStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(true);
  const [grains, setGrains] = useState(0);
  const [avalanche, setAvalanche] = useState(0);
  const grid = useRef<Uint32Array>(new Uint32Array(N * N));
  const total = useRef(0);

  const reset = () => { grid.current = new Uint32Array(N * N); total.current = 0; setGrains(0); };

  useEffect(() => {
    if (!running) return; let raf = 0;
    const c = ((N / 2) | 0) * N + ((N / 2) | 0);
    const loop = () => {
      const g = grid.current;
      for (let drop = 0; drop < 30; drop++) { g[c]++; total.current++; }
      // relax (topple) until stable
      let toppled = 0, unstable = true, guard = 0;
      while (unstable && guard++ < 200) { unstable = false;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (g[i] >= 4) { const n4 = (g[i] / 4) | 0; g[i] -= n4 * 4; toppled += n4 * 4; unstable = true;
          if (x > 0) g[i - 1] += n4; if (x < N - 1) g[i + 1] += n4; if (y > 0) g[i - N] += n4; if (y < N - 1) g[i + N] += n4; } } }
      setGrains(total.current); setAvalanche(toppled);
      const ctx = hidpi(canvasRef.current!, N * CELL, N * CELL);
      for (let i = 0; i < N * N; i++) { ctx.fillStyle = COLORS[Math.min(3, g[i])]; ctx.fillRect((i % N) * CELL, ((i / N) | 0) * CELL, CELL, CELL); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running]);

  return (
    <StudioChrome title="Abelian Sandpile" tagline="self-organized criticality"
      controls={<div>
        <div className="flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
        <p className="mt-3 text-xs text-slate-500">Grains drop on the center cell. When a cell reaches 4 grains it topples, sending one to each neighbor — which can trigger chain-reaction avalanches. The pile self-organizes into an intricate fractal at the critical slope.</p>
      </div>}
      inspector={<div><Stat label="Grains added" value={grains.toLocaleString()} /><Stat label="Last avalanche" value={avalanche.toLocaleString()} /><Stat label="Topple at" value="4 grains" /></div>}
    ><canvas ref={canvasRef} width={N * CELL} height={N * CELL} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
