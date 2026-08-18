"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const N = 120, CELL = 4;

export function FireSpreadStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [windSpeed, setWindSpeed] = useState(15);
  const [windDir, setWindDir] = useState(90); // degrees, 0 = east
  const [slope, setSlope] = useState(10);
  const [fuel, setFuel] = useState(0.75);
  const [running, setRunning] = useState(true);
  const [seed, setSeed] = useState(1);
  const [burned, setBurned] = useState(0);
  const grid = useRef<Uint8Array>(new Uint8Array(N * N)); // 0 fuel,1 burning,2 burned,3 no-fuel

  const reset = () => { let s = seed * 40961 >>> 0; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const g = new Uint8Array(N * N); for (let i = 0; i < N * N; i++) g[i] = r() < fuel ? 0 : 3;
    const c = ((N / 2) | 0) * N + ((N / 2) | 0); g[c] = 1; g[c + 1] = 1; g[c + N] = 1; grid.current = g; setBurned(0); };
  useEffect(reset, [seed, fuel]);

  useEffect(() => {
    if (!running) return; let raf = 0; let s = 77; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const wr = (windDir * Math.PI) / 180; const wx = Math.cos(wr), wy = Math.sin(wr);
    const loop = () => {
      const g = grid.current; const next = g.slice(); let bc = 0;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x;
        if (g[i] === 2) bc++;
        if (g[i] === 1) { next[i] = 2; bc++;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const ni = ny * N + nx; if (g[ni] !== 0) continue;
            const align = (dx * wx + dy * wy) / (Math.hypot(dx, dy) || 1); // -1..1
            const windBoost = 1 + (windSpeed / 25) * align; const slopeBoost = 1 + (slope / 45) * Math.max(0, -dy) * 0.6;
            const p = 0.28 * windBoost * slopeBoost; if (rnd() < p) next[ni] = 1; } }
      }
      grid.current = next; setBurned(bc);
      const ctx = hidpi(canvasRef.current!, N * CELL, N * CELL); ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, N * CELL, N * CELL);
      for (let i = 0; i < N * N; i++) { const v = next[i]; let col = ""; if (v === 0) col = "#166534"; else if (v === 1) col = "#f97316"; else if (v === 2) col = "#3f3f46"; else col = "#1e293b"; ctx.fillStyle = col; ctx.fillRect((i % N) * CELL, ((i / N) | 0) * CELL, CELL, CELL); }
      // wind arrow
      ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(30, 30); ctx.lineTo(30 + wx * 22, 30 + wy * 22); ctx.stroke();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, windSpeed, windDir, slope]);

  return (
    <StudioChrome title="Wildfire / Fire Spread" tagline="wind + slope driven spread"
      controls={<div>
        <Slider label="Wind speed" value={windSpeed} min={0} max={40} step={1} onChange={setWindSpeed} />
        <Slider label="Wind direction" value={windDir} min={0} max={360} step={15} onChange={setWindDir} />
        <Slider label="Slope" value={slope} min={0} max={45} step={1} onChange={setSlope} />
        <Slider label="Fuel density" value={fuel} min={0.4} max={1} step={0.05} onChange={setFuel} />
        <div className="mt-3 flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reignite</button></div>
        <p className="mt-3 text-xs text-slate-500">Fire spreads cell to cell, biased downwind and uphill — the two dominant drivers of real wildfire rate-of-spread. Rotate the wind and raise the slope to see how a fire front elongates and races upslope. For training and situational awareness only.</p>
      </div>}
      inspector={<div><Stat label="Cells burned" value={burned.toLocaleString()} /><Stat label="Wind" value={`${windSpeed} @ ${windDir}°`} /><Stat label="Slope" value={`${slope}°`} /></div>}
    ><canvas ref={canvasRef} width={N * CELL} height={N * CELL} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
