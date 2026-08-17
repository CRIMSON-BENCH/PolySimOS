"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 760, H = 420;
interface Ball { x: number; y: number; vx: number; vy: number; r: number; m: number; }

export function CollisionsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const balls = useRef<Ball[]>([]);
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [n, setN] = useState(12);
  const [restitution, setRestitution] = useState(1);
  const [ke, setKe] = useState(0);

  const seed = () => { balls.current = Array.from({ length: n }, () => { const r = 12 + Math.random() * 18; return { x: r + Math.random() * (W - 2 * r), y: r + Math.random() * (H - 2 * r), vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, r, m: r * r }; }); };
  useEffect(() => { seed(); /* eslint-disable-next-line */ }, [n]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    const loop = () => {
      const B = balls.current; const e = restitution;
      if (running) {
        for (const b of B) { b.x += b.vx; b.y += b.vy; if (b.x < b.r) { b.x = b.r; b.vx = -b.vx * e; } if (b.x > W - b.r) { b.x = W - b.r; b.vx = -b.vx * e; } if (b.y < b.r) { b.y = b.r; b.vy = -b.vy * e; } if (b.y > H - b.r) { b.y = H - b.r; b.vy = -b.vy * e; } }
        for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) { const a = B[i], b = B[j]; const dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy); if (d > 0 && d < a.r + b.r) { const nx = dx / d, ny = dy / d; const ov = a.r + b.r - d; const im = 1 / a.m + 1 / b.m; a.x -= nx * ov * (1 / a.m) / im; a.y -= ny * ov * (1 / a.m) / im; b.x += nx * ov * (1 / b.m) / im; b.y += ny * ov * (1 / b.m) / im; const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; if (rv < 0) { const jimp = -(1 + e) * rv / im; a.vx -= jimp * nx / a.m; a.vy -= jimp * ny / a.m; b.vx += jimp * nx / b.m; b.vy += jimp * ny / b.m; } } }
      }
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H); let total = 0;
      for (const b of B) { const sp = Math.hypot(b.vx, b.vy); total += 0.5 * b.m * sp * sp; ctx.fillStyle = `hsl(${190 - Math.min(140, sp * 12)},85%,60%)`; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); }
      setKe(total);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [running, restitution]);

  return (
    <StudioChrome title="Elastic Collisions" tagline="momentum & energy conservation"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button><button onClick={seed} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
        <p className="mb-3 text-xs text-slate-500">Balls collide with impulse-based physics. At restitution 1, kinetic energy is conserved; below 1, collisions are inelastic and energy drains away.</p>
        <Slider label="Balls" value={n} min={2} max={30} step={1} onChange={setN} />
        <Slider label="Restitution" value={restitution} min={0.5} max={1} step={0.05} onChange={setRestitution} />
      </div>}
      inspector={<div><Stat label="Balls" value={String(n)} /><Stat label="Total KE" value={ke.toExponential(2)} /><Stat label="Collisions" value={restitution === 1 ? "elastic" : "inelastic"} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
