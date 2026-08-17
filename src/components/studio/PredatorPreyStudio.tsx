"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const N = 140; // grid
const EMPTY = 0, PREY = 1, PRED = 2;

export function PredatorPreyStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const grid = useRef<Uint8Array>(new Uint8Array(N * N));
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [preyRepro, setPreyRepro] = useState(0.5);
  const [predStarve, setPredStarve] = useState(0.02);
  const [counts, setCounts] = useState({ prey: 0, pred: 0 });

  const seed = () => { const g = new Uint8Array(N * N); for (let i = 0; i < N * N; i++) { const r = Math.random(); g[i] = r < 0.3 ? PREY : r < 0.34 ? PRED : EMPTY; } grid.current = g; };
  useEffect(() => { seed(); }, []);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const img = ctx.createImageData(N, N); let frame = 0;
    const nbrs = (i: number) => { const x = i % N, y = (i / N) | 0; return [((x + 1) % N) + y * N, ((x - 1 + N) % N) + y * N, x + ((y + 1) % N) * N, x + ((y - 1 + N) % N) * N]; };
    const loop = () => {
      const g = grid.current;
      if (running) {
        for (let k = 0; k < N * N; k++) {
          const i = (Math.random() * N * N) | 0; const nb = nbrs(i); const t = nb[(Math.random() * 4) | 0];
          if (g[i] === PRED) { if (g[t] === PREY) g[t] = PRED; else if (Math.random() < predStarve) g[i] = EMPTY; }
          else if (g[i] === PREY) { if (g[t] === EMPTY && Math.random() < preyRepro) g[t] = PREY; }
        }
      }
      let prey = 0, pred = 0;
      for (let i = 0; i < N * N; i++) { const v = g[i]; if (v === PREY) prey++; else if (v === PRED) pred++; img.data[i * 4] = v === PRED ? 244 : 15; img.data[i * 4 + 1] = v === PREY ? 200 : v === PRED ? 100 : 20; img.data[i * 4 + 2] = v === PREY ? 60 : v === PRED ? 120 : 30; img.data[i * 4 + 3] = 255; }
      ctx.putImageData(img, 0, 0);
      if (frame++ % 8 === 0) setCounts({ prey, pred });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [running, preyRepro, predStarve]);

  return (
    <StudioChrome title="Spatial Predator–Prey" tagline="agent-based ecology on a grid"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button><button onClick={seed} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reseed</button></div>
        <p className="mb-3 text-xs text-slate-500">Prey (green) spread; predators (red) hunt them and starve without food. Spatial structure creates traveling waves the classic equations can&apos;t show.</p>
        <Slider label="Prey reproduction" value={preyRepro} min={0.1} max={0.9} step={0.05} onChange={setPreyRepro} />
        <Slider label="Predator starvation" value={predStarve} min={0.005} max={0.08} step={0.005} onChange={setPredStarve} />
      </div>}
      inspector={<div><Stat label="Prey" value={counts.prey.toLocaleString()} /><Stat label="Predators" value={counts.pred.toLocaleString()} /><Stat label="Grid" value={`${N}×${N}`} /></div>}
    ><canvas ref={canvasRef} width={N} height={N} className="mx-auto h-auto max-h-[440px] rounded-lg" style={{ imageRendering: "pixelated", width: "440px" }} /></StudioChrome>
  );
}
