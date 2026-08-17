"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Ant Colony Optimization for the Traveling Salesman Problem.
export function AntColonyStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nCities, setNCities] = useState(15);
  const [nAnts, setNAnts] = useState(20);
  const [evap, setEvap] = useState(0.1);
  const [running, setRunning] = useState(true);
  const [seed, setSeed] = useState(1);
  const [iter, setIter] = useState(0);
  const [bestLen, setBestLen] = useState(0);
  const cities = useRef<[number, number][]>([]);
  const phero = useRef<number[][]>([]);
  const bestTour = useRef<number[]>([]);

  const W = 480, H = 400;
  const init = () => { const M = Math.round(nCities); let s = seed * 15485863 >>> 0; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    cities.current = Array.from({ length: M }, () => [40 + r() * (W - 80), 40 + r() * (H - 80)] as [number, number]);
    phero.current = Array.from({ length: M }, () => new Array(M).fill(1)); bestTour.current = []; setBestLen(0); setIter(0); };
  useEffect(init, [nCities, seed]);

  useEffect(() => {
    if (!running) return; let raf = 0; let s = 4242;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const dist = (a: number, b: number) => Math.hypot(cities.current[a][0] - cities.current[b][0], cities.current[a][1] - cities.current[b][1]);
    const tourLen = (t: number[]) => t.reduce((sum, c, i) => sum + dist(c, t[(i + 1) % t.length]), 0);
    const loop = () => {
      const M = cities.current.length; const ph = phero.current; const alpha = 1, beta = 3;
      const deposit = Array.from({ length: M }, () => new Array(M).fill(0));
      let roundBest: number[] = [], roundBestLen = Infinity;
      for (let k = 0; k < Math.round(nAnts); k++) {
        const start = (rnd() * M) | 0; const visited = new Set([start]); const tour = [start];
        while (tour.length < M) { const cur = tour[tour.length - 1]; let sumP = 0; const probs: [number, number][] = [];
          for (let j = 0; j < M; j++) { if (visited.has(j)) continue; const p = Math.pow(ph[cur][j], alpha) * Math.pow(1 / (dist(cur, j) + 1e-6), beta); probs.push([j, p]); sumP += p; }
          let pick = probs[0][0], rv = rnd() * sumP; for (const [j, p] of probs) { rv -= p; if (rv <= 0) { pick = j; break; } }
          visited.add(pick); tour.push(pick); }
        const L = tourLen(tour); if (L < roundBestLen) { roundBestLen = L; roundBest = tour; }
        for (let i = 0; i < M; i++) { const a = tour[i], b = tour[(i + 1) % M]; deposit[a][b] += 1 / L; deposit[b][a] += 1 / L; }
      }
      for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) ph[i][j] = ph[i][j] * (1 - evap) + deposit[i][j];
      if (!bestTour.current.length || roundBestLen < tourLen(bestTour.current)) bestTour.current = roundBest;
      setBestLen(tourLen(bestTour.current)); setIter((n) => n + 1);
      const ctx = canvasRef.current!.getContext("2d")!; ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, W, H);
      let maxP = 0; for (let i = 0; i < M; i++) for (let j = i + 1; j < M; j++) maxP = Math.max(maxP, ph[i][j]);
      for (let i = 0; i < M; i++) for (let j = i + 1; j < M; j++) { const a = ph[i][j] / (maxP || 1); if (a < 0.08) continue; ctx.strokeStyle = `rgba(34,211,238,${a * 0.5})`; ctx.lineWidth = a * 3; ctx.beginPath(); ctx.moveTo(cities.current[i][0], cities.current[i][1]); ctx.lineTo(cities.current[j][0], cities.current[j][1]); ctx.stroke(); }
      const bt = bestTour.current; if (bt.length) { ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2; ctx.beginPath(); bt.forEach((c, i) => { const p = cities.current[c]; i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.closePath(); ctx.stroke(); }
      cities.current.forEach((p) => { ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, 7); ctx.fillStyle = "#f472b6"; ctx.fill(); });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, nAnts, evap]);

  return (
    <StudioChrome title="Ant Colony Optimization" tagline="swarm intelligence · TSP"
      controls={<div>
        <Slider label="Cities" value={nCities} min={6} max={30} step={1} onChange={setNCities} />
        <Slider label="Ants" value={nAnts} min={5} max={60} step={5} onChange={setNAnts} />
        <Slider label="Evaporation" value={evap} min={0.02} max={0.5} step={0.02} onChange={setEvap} />
        <div className="mt-3 flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={init} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">New map</button></div>
        <p className="mt-3 text-xs text-slate-500">Simulated ants lay pheromone (cyan) on short routes; trails evaporate over time so good paths reinforce and bad ones fade. The colony collectively finds near-optimal tours of the Traveling Salesman Problem — the green loop is the best so far.</p>
      </div>}
      inspector={<div><Stat label="Iteration" value={String(iter)} /><Stat label="Best tour" value={bestLen.toFixed(0)} /><Stat label="Cities" value={String(Math.round(nCities))} /></div>}
    ><canvas ref={canvasRef} width={480} height={400} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
