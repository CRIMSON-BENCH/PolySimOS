"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const N = 130, CELL = 4;

export function LangtonStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(20);
  const [steps, setSteps] = useState(0);
  const grid = useRef<Uint8Array>(new Uint8Array(N * N));
  const ant = useRef({ x: (N / 2) | 0, y: (N / 2) | 0, dir: 0 }); // 0 up,1 right,2 down,3 left

  const reset = () => { grid.current = new Uint8Array(N * N); ant.current = { x: (N / 2) | 0, y: (N / 2) | 0, dir: 0 }; setSteps(0);
    const ctx = hidpi(canvasRef.current!, N * CELL, N * CELL); ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, N * CELL, N * CELL); };
  useEffect(reset, []);

  useEffect(() => {
    if (!running) return; let raf = 0;
    const dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0];
    const loop = () => {
      const g = grid.current; const a = ant.current; const ctx = hidpi(canvasRef.current!, N * CELL, N * CELL);
      for (let k = 0; k < speed; k++) {
        const i = a.y * N + a.x;
        if (g[i] === 0) { a.dir = (a.dir + 1) & 3; g[i] = 1; } else { a.dir = (a.dir + 3) & 3; g[i] = 0; }
        ctx.fillStyle = g[i] ? "#a3e635" : "#0b1220"; ctx.fillRect(a.x * CELL, a.y * CELL, CELL, CELL);
        a.x = (a.x + dx[a.dir] + N) % N; a.y = (a.y + dy[a.dir] + N) % N;
      }
      ctx.fillStyle = "#f472b6"; ctx.fillRect(a.x * CELL, a.y * CELL, CELL, CELL);
      setSteps((n) => n + speed);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, speed]);

  return (
    <StudioChrome title="Langton's Ant" tagline="two rules, emergent order"
      controls={<div>
        <label className="text-xs text-slate-500">Speed (steps/frame)</label>
        <input type="range" min={1} max={200} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-full" />
        <div className="mt-3 flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
        <p className="mt-3 text-xs text-slate-500">Two rules: on white, turn right and flip the cell; on black, turn left and flip. After about 10,000 steps of apparent chaos, the ant spontaneously builds a periodic highway — order from simplicity.</p>
      </div>}
      inspector={<div><Stat label="Steps" value={steps.toLocaleString()} /><Stat label="Highway at" value="~10,000" /><Stat label="Grid" value={`${N}²`} /></div>}
    ><canvas ref={canvasRef} width={N * CELL} height={N * CELL} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
