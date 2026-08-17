"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Simulated annealing minimizing a rugged 1D landscape.
const f = (x: number) => Math.sin(x) * 2 + Math.sin(2.3 * x + 1) + Math.sin(0.7 * x) * 1.5 + 0.02 * (x - 8) ** 2;

export function SimulatedAnnealingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coolRate, setCoolRate] = useState(0.995);
  const [running, setRunning] = useState(true);
  const [seed, setSeed] = useState(1);
  const [state, setState] = useState({ x: 8, best: 8, T: 5, bestF: 0 });

  useEffect(() => {
    if (!running) return; let raf = 0; let s = seed * 4133 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    let x = rnd() * 16, T = 5, bestX = x, bestF = f(x);
    const loop = () => {
      for (let k = 0; k < 8; k++) { const nx = Math.max(0, Math.min(16, x + (rnd() - 0.5) * T * 2)); const dE = f(nx) - f(x); if (dE < 0 || rnd() < Math.exp(-dE / T)) x = nx; if (f(x) < bestF) { bestF = f(x); bestX = x; } T *= coolRate; if (T < 0.01) T = 0.01; }
      setState({ x, best: bestX, T, bestF });
      const ctx = canvasRef.current!.getContext("2d")!; const W = 540, H = 300; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const ox = 20, oy = H - 40, pw = W - 40, ph = H - 70; const X = (xx: number) => ox + (xx / 16) * pw; let mn = Infinity, mx = -Infinity; for (let i = 0; i <= 100; i++) { const v = f(i / 100 * 16); mn = Math.min(mn, v); mx = Math.max(mx, v); }
      const Y = (v: number) => oy - ((v - mn) / (mx - mn)) * ph;
      ctx.strokeStyle = "#334155"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 200; i++) { const xx = i / 200 * 16; i ? ctx.lineTo(X(xx), Y(f(xx))) : ctx.moveTo(X(xx), Y(f(xx))); } ctx.stroke();
      ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(X(x), Y(f(x)), 6, 0, 7); ctx.fill();
      ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(X(bestX), Y(bestF), 4, 0, 7); ctx.fill();
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`T = ${T.toFixed(2)} — pink = current, green = best`, ox, 18);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, coolRate, seed]);

  return (
    <StudioChrome title="Simulated Annealing" tagline="escaping local minima"
      controls={<div>
        <Slider label="Cooling rate" value={coolRate} min={0.95} max={0.999} step={0.001} onChange={setCoolRate} />
        <div className="mt-3 flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={() => setSeed((k) => k + 1)} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Restart</button></div>
        <p className="mt-3 text-xs text-slate-500">Simulated annealing borrows from metallurgy: at high temperature it accepts worse moves freely, letting it jump out of local minima; as it cools, it settles into the best valley it found. The acceptance probability exp(−ΔE/T) is the key. Cool too fast and it gets stuck; cool slowly and it finds the global optimum.</p>
      </div>}
      inspector={<div><Stat label="Temperature" value={state.T.toFixed(2)} /><Stat label="Current value" value={f(state.x).toFixed(3)} /><Stat label="Best found" value={state.bestF.toFixed(3)} /></div>}
    ><canvas ref={canvasRef} width={540} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
