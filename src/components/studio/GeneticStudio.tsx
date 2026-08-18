"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Evolve (x,y) to maximize a multi-peak fitness landscape.
export function GeneticStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [popSize, setPopSize] = useState(80);
  const [mutation, setMutation] = useState(0.08);
  const [running, setRunning] = useState(true);
  const [seed, setSeed] = useState(1);
  const [gen, setGen] = useState(0);
  const [best, setBest] = useState(0);
  const pop = useRef<[number, number][]>([]);

  const W = 460, H = 400;
  const fit = (x: number, y: number) => { const gx = x / W, gy = y / H;
    return Math.exp(-((gx - 0.7) ** 2 + (gy - 0.3) ** 2) / 0.02) + 0.8 * Math.exp(-((gx - 0.25) ** 2 + (gy - 0.7) ** 2) / 0.03) + 0.6 * Math.exp(-((gx - 0.5) ** 2 + (gy - 0.5) ** 2) / 0.05); };

  const init = () => { let s = seed * 22699 >>> 0; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    pop.current = Array.from({ length: Math.round(popSize) }, () => [r() * W, r() * H] as [number, number]); setGen(0); };
  useEffect(init, [popSize, seed]);

  useEffect(() => {
    if (!running) return; let raf = 0; let s = 918;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const loop = () => {
      const scored = pop.current.map((p) => [p, fit(p[0], p[1])] as [[number, number], number]).sort((a, b) => b[1] - a[1]);
      setBest(scored[0][1]); setGen((g) => g + 1);
      const elite = scored.slice(0, Math.max(2, (scored.length * 0.3) | 0)).map((s2) => s2[0]);
      const next: [number, number][] = [...elite];
      while (next.length < pop.current.length) { const a = elite[(rnd() * elite.length) | 0], b = elite[(rnd() * elite.length) | 0];
        let nx = rnd() < 0.5 ? a[0] : b[0], ny = rnd() < 0.5 ? a[1] : b[1];
        if (rnd() < mutation) nx += (rnd() - 0.5) * W * 0.2; if (rnd() < mutation) ny += (rnd() - 0.5) * H * 0.2;
        next.push([Math.max(0, Math.min(W, nx)), Math.max(0, Math.min(H, ny))]); }
      pop.current = next;
      const ctx = hidpi(canvasRef.current!, W, H); const img = ctx.createImageData(W, H);
      for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const v = Math.min(1, fit(x, y)); for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const idx = ((y + dy) * W + (x + dx)) * 4; img.data[idx] = 11 + v * 60; img.data[idx + 1] = 18 + v * 120; img.data[idx + 2] = 32 + v * 90; img.data[idx + 3] = 255; } }
      ctx.putImageData(img, 0, 0);
      pop.current.forEach((p) => { ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, 7); ctx.fillStyle = "#f472b6"; ctx.fill(); });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, mutation]);

  return (
    <StudioChrome title="Genetic Algorithm" tagline="evolution as optimization"
      controls={<div>
        <Slider label="Population" value={popSize} min={20} max={200} step={10} onChange={setPopSize} />
        <Slider label="Mutation rate" value={mutation} min={0.01} max={0.4} step={0.01} onChange={setMutation} />
        <div className="mt-3 flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={init} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Restart</button></div>
        <p className="mt-3 text-xs text-slate-500">A population of candidate solutions is scored by fitness (bright = high). The fittest are selected, crossed over, and mutated each generation. Watch the swarm climb toward the global peak while dodging local optima.</p>
      </div>}
      inspector={<div><Stat label="Generation" value={String(gen)} /><Stat label="Best fitness" value={best.toFixed(3)} /><Stat label="Population" value={String(Math.round(popSize))} /></div>}
    ><canvas ref={canvasRef} width={460} height={400} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
