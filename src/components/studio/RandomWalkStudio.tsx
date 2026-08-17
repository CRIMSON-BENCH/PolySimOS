"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 760, H = 480;

export function RandomWalkStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const walkers = useRef<{ x: number; y: number }[]>([]);
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [n, setN] = useState(400);
  const [step, setStep] = useState(2);
  const [rms, setRms] = useState(0);
  const steps = useRef(0);

  const reset = () => { walkers.current = Array.from({ length: n }, () => ({ x: W / 2, y: H / 2 })); steps.current = 0; };
  useEffect(() => { reset(); /* eslint-disable-next-line */ }, [n]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const loop = () => {
      const ws = walkers.current;
      ctx.fillStyle = "rgba(2,6,23,0.06)"; ctx.fillRect(0, 0, W, H);
      if (running) { steps.current++; for (const w of ws) { const a = Math.random() * Math.PI * 2; w.x += Math.cos(a) * step; w.y += Math.sin(a) * step; } }
      let sum = 0; for (const w of ws) { const dx = w.x - W / 2, dy = w.y - H / 2; sum += dx * dx + dy * dy; ctx.fillStyle = "rgba(34,211,238,0.7)"; ctx.fillRect(w.x, w.y, 2, 2); }
      setRms(Math.sqrt(sum / ws.length));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [running, step]);

  return (
    <StudioChrome title="Random Walk & Diffusion" tagline="Brownian motion · √t spreading"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button><button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
        <p className="mb-3 text-xs text-slate-500">Hundreds of walkers start at the center and step randomly. The cloud spreads as √(time) — the signature of diffusion.</p>
        <Slider label="Walkers" value={n} min={50} max={1500} step={50} onChange={setN} />
        <Slider label="Step size" value={step} min={1} max={6} step={0.5} onChange={setStep} />
      </div>}
      inspector={<div><Stat label="Walkers" value={String(n)} /><Stat label="Steps" value={String(steps.current)} /><Stat label="RMS distance" value={rms.toFixed(1)} /><Stat label="Law" value="⟨r²⟩ ∝ t" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
