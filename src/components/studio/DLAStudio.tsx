"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const N = 200;

export function DLAStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const grid = useRef<Uint8Array>(new Uint8Array(N * N));
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [perFrame, setPerFrame] = useState(80);
  const [count, setCount] = useState(1);

  const seed = () => { const g = new Uint8Array(N * N); g[((N / 2) | 0) * N + ((N / 2) | 0)] = 1; grid.current = g; setCount(1); };
  useEffect(() => { seed(); }, []);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const img = ctx.createImageData(N, N); let stuck = 1;
    const occupied = (x: number, y: number) => x >= 0 && y >= 0 && x < N && y < N && grid.current[y * N + x] === 1;
    const loop = () => {
      const g = grid.current;
      if (running) {
        for (let w = 0; w < perFrame; w++) {
          const ang = Math.random() * Math.PI * 2, R = N * 0.46; let x = Math.round(N / 2 + Math.cos(ang) * R), y = Math.round(N / 2 + Math.sin(ang) * R);
          for (let s = 0; s < 600; s++) {
            if (occupied(x + 1, y) || occupied(x - 1, y) || occupied(x, y + 1) || occupied(x, y - 1)) { if (x > 0 && y > 0 && x < N && y < N) { g[y * N + x] = 1; stuck++; } break; }
            x += (Math.random() * 3 | 0) - 1; y += (Math.random() * 3 | 0) - 1;
            const dx = x - N / 2, dy = y - N / 2; if (dx * dx + dy * dy > (N * 0.49) ** 2) break;
          }
        }
        setCount(stuck);
      }
      for (let i = 0; i < N * N; i++) { const on = g[i]; img.data[i * 4] = on ? 34 : 2; img.data[i * 4 + 1] = on ? 211 : 6; img.data[i * 4 + 2] = on ? 238 : 23; img.data[i * 4 + 3] = 255; }
      ctx.putImageData(img, 0, 0);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [running, perFrame]);

  return (
    <StudioChrome title="Diffusion-Limited Aggregation" tagline="fractal growth · Brownian sticking"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button><button onClick={seed} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
        <p className="mb-3 text-xs text-slate-500">Particles wander randomly from the edge and stick where they touch the cluster. The result is a branching fractal — like frost, coral, and mineral dendrites.</p>
        <Slider label="Speed (walkers/frame)" value={perFrame} min={10} max={200} step={10} onChange={setPerFrame} />
      </div>}
      inspector={<div><Stat label="Cluster size" value={count.toLocaleString()} /><Stat label="Grid" value={`${N}×${N}`} /><Stat label="Fractal dim." value="≈ 1.71" /></div>}
    ><canvas ref={canvasRef} width={N} height={N} className="mx-auto h-auto max-h-[440px] rounded-lg" style={{ imageRendering: "pixelated", width: "440px" }} /></StudioChrome>
  );
}
