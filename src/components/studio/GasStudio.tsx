"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 480, H = 420;

export function GasStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const atoms = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [n, setN] = useState(120);
  const [temp, setTemp] = useState(3);
  const [pressure, setPressure] = useState(0);
  const wallHits = useRef(0);

  const seed = () => { atoms.current = Array.from({ length: n }, () => { const a = Math.random() * 7; return { x: 20 + Math.random() * (W - 40), y: 20 + Math.random() * (H - 40), vx: Math.cos(a) * temp, vy: Math.sin(a) * temp }; }); };
  useEffect(() => { seed(); /* eslint-disable-next-line */ }, [n]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; let frame = 0;
    const loop = () => {
      const A = atoms.current; const r = 4;
      if (running) {
        for (const p of A) { p.x += p.vx; p.y += p.vy;
          if (p.x < r) { p.x = r; p.vx = -p.vx; wallHits.current += Math.abs(p.vx); } if (p.x > W - r) { p.x = W - r; p.vx = -p.vx; wallHits.current += Math.abs(p.vx); }
          if (p.y < r) { p.y = r; p.vy = -p.vy; wallHits.current += Math.abs(p.vy); } if (p.y > H - r) { p.y = H - r; p.vy = -p.vy; wallHits.current += Math.abs(p.vy); } }
        for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) { const dx = A[j].x - A[i].x, dy = A[j].y - A[i].y; const d = Math.hypot(dx, dy); if (d > 0 && d < 2 * r) { const nx = dx / d, ny = dy / d; const p = (A[i].vx - A[j].vx) * nx + (A[i].vy - A[j].vy) * ny; A[i].vx -= p * nx; A[i].vy -= p * ny; A[j].vx += p * nx; A[j].vy += p * ny; const ov = 2 * r - d; A[i].x -= nx * ov / 2; A[i].y -= ny * ov / 2; A[j].x += nx * ov / 2; A[j].y += ny * ov / 2; } }
      }
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      for (const p of A) { const sp = Math.hypot(p.vx, p.vy); ctx.fillStyle = `hsl(${200 - Math.min(160, sp * 20)},90%,60%)`; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill(); }
      if (frame++ % 30 === 0) { setPressure(wallHits.current / 30); wallHits.current = 0; }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  useEffect(() => { for (const p of atoms.current) { const sp = Math.hypot(p.vx, p.vy) || 1; const a = Math.atan2(p.vy, p.vx); const nv = temp; p.vx = Math.cos(a) * nv; p.vy = Math.sin(a) * nv; void sp; } }, [temp]);

  return (
    <StudioChrome title="Gas in a Box — Kinetic Theory" tagline="ideal gas · pressure from collisions"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button><button onClick={seed} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
        <p className="mb-3 text-xs text-slate-500">Pressure emerges from molecules hammering the walls. More particles or higher temperature → higher pressure, exactly as PV = nRT predicts.</p>
        <Slider label="Particles (n)" value={n} min={20} max={300} step={20} onChange={setN} />
        <Slider label="Temperature" value={temp} min={0.5} max={7} step={0.5} onChange={setTemp} />
      </div>}
      inspector={<div><Stat label="Particles" value={String(n)} /><Stat label="Temperature" value={temp.toFixed(1)} /><Stat label="Pressure (wall)" value={pressure.toFixed(0)} /><Stat label="Law" value="PV = nRT" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[440px] rounded-lg" /></StudioChrome>
  );
}
