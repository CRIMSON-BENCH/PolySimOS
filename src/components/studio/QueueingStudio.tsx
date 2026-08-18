"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// M/M/1 queue metrics + live simulation.
export function QueueingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lambda, setLambda] = useState(0.7); // arrival rate
  const [mu, setMu] = useState(1.0); // service rate
  const [running, setRunning] = useState(true);
  const queue = useRef(0);
  const [display, setDisplay] = useState(0);

  const rho = lambda / mu; const stable = rho < 1;
  const L = stable ? rho / (1 - rho) : Infinity; const W = stable ? 1 / (mu - lambda) : Infinity; const Lq = stable ? rho * rho / (1 - rho) : Infinity;

  useEffect(() => {
    if (!running) return; let raf = 0; let s = 21; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const loop = () => {
      if (rnd() < lambda * 0.05) queue.current++;
      if (queue.current > 0 && rnd() < mu * 0.05) queue.current--;
      if (queue.current > 60) queue.current = 60;
      setDisplay(queue.current);
      const ctx = hidpi(canvasRef.current!, 540, 240); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 540, 240);
      // server
      ctx.fillStyle = "#a3e635"; ctx.fillRect(460, 100, 50, 50); ctx.fillStyle = "#0b1220"; ctx.font = "11px sans-serif"; ctx.fillText("server", 468, 128);
      // queue of customers
      for (let i = 0; i < Math.min(queue.current, 30); i++) { ctx.fillStyle = i === 0 ? "#f472b6" : "#22d3ee"; ctx.beginPath(); ctx.arc(440 - i * 14, 125, 5, 0, 7); ctx.fill(); }
      ctx.fillStyle = "#94a3b8"; ctx.fillText(`in system: ${queue.current}`, 20, 30);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, lambda, mu]);

  return (
    <StudioChrome title="M/M/1 Queue" tagline="queueing theory"
      controls={<div>
        <Slider label="Arrival rate λ" value={lambda} min={0.1} max={1.5} step={0.05} onChange={setLambda} />
        <Slider label="Service rate μ" value={mu} min={0.3} max={2} step={0.05} onChange={setMu} />
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">The M/M/1 queue models a single server with random arrivals and service — a checkout, help desk, or router. The utilization ρ = λ/μ decides everything: as it approaches 1, the average wait and queue length explode toward infinity. This nonlinear blow-up is why systems run at, say, 80% and not 99% capacity.</p>
      </div>}
      inspector={<div><Stat label="Utilization ρ" value={rho.toFixed(2)} /><Stat label="Avg in system L" value={stable ? L.toFixed(2) : "∞"} /><Stat label="Avg wait W" value={stable ? `${W.toFixed(2)}` : "∞"} /><Stat label="Live count" value={String(display)} /></div>}
    ><canvas ref={canvasRef} width={540} height={240} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
