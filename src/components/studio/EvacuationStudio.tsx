"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 480, H = 400;

export function EvacuationStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [count, setCount] = useState(150);
  const [exits, setExits] = useState(2);
  const [speed, setSpeed] = useState(1.3);
  const [running, setRunning] = useState(true);
  const [seed, setSeed] = useState(1);
  const [evac, setEvac] = useState(0);
  const [time, setTime] = useState(0);
  const agents = useRef<{ x: number; y: number; out: boolean }[]>([]);
  const t0 = useRef(0);

  const exitList = () => { const n = Math.round(exits); const arr: [number, number][] = []; for (let i = 0; i < n; i++) arr.push([W - 4, (H * (i + 1)) / (n + 1)]); return arr; };

  const reset = () => { let s = seed * 30011 >>> 0; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    agents.current = Array.from({ length: Math.round(count) }, () => ({ x: 30 + r() * (W * 0.5), y: 30 + r() * (H - 60), out: false })); setEvac(0); setTime(0); t0.current = 0; };
  useEffect(reset, [count, exits, seed]);

  useEffect(() => {
    if (!running) return; let raf = 0;
    const loop = () => {
      const exs = exitList(); const R = 6;
      let done = 0;
      const A = agents.current;
      for (const a of A) { if (a.out) { done++; continue; }
        // nearest exit
        let ex = exs[0], bd = Infinity; for (const e of exs) { const d = (a.x - e[0]) ** 2 + (a.y - e[1]) ** 2; if (d < bd) { bd = d; ex = e; } }
        let dx = ex[0] - a.x, dy = ex[1] - a.y; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
        // repulsion from neighbors (congestion)
        let rx = 0, ry = 0; for (const b of A) { if (b === a || b.out) continue; const ddx = a.x - b.x, ddy = a.y - b.y; const dd = ddx * ddx + ddy * ddy; if (dd < 400 && dd > 0.01) { const f = (1 - Math.sqrt(dd) / 20) / Math.sqrt(dd); rx += ddx * f; ry += ddy * f; } }
        const vx = dx * speed + rx * 2.2, vy = dy * speed + ry * 2.2;
        a.x = Math.max(6, Math.min(W - 2, a.x + vx)); a.y = Math.max(6, Math.min(H - 6, a.y + vy));
        if (a.x >= W - 8 && Math.abs(a.y - ex[1]) < 22) a.out = true;
      }
      setEvac(done); if (done < A.length) { t0.current += 1 / 60; setTime(t0.current); }
      const ctx = canvasRef.current!.getContext("2d")!; ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#334155"; ctx.lineWidth = 3; ctx.strokeRect(4, 4, W - 8, H - 8);
      ctx.fillStyle = "#a3e635"; for (const e of exs) ctx.fillRect(W - 8, e[1] - 20, 8, 40);
      for (const a of A) { if (a.out) continue; ctx.beginPath(); ctx.arc(a.x, a.y, R * 0.6, 0, 7); ctx.fillStyle = "#22d3ee"; ctx.fill(); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, speed, exits]);

  return (
    <StudioChrome title="Building Evacuation / Egress" tagline="crowd flow through exits"
      controls={<div>
        <Slider label="Occupants" value={count} min={20} max={300} step={10} onChange={setCount} />
        <Slider label="Exits" value={exits} min={1} max={5} step={1} onChange={setExits} />
        <Slider label="Walk speed" value={speed} min={0.6} max={2.5} step={0.1} onChange={setSpeed} />
        <div className="mt-3 flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
        <p className="mt-3 text-xs text-slate-500">Occupants head for the nearest exit while pushing apart in crowds, so bottlenecks and congestion form at doorways — the effect that drives real egress times. Add or remove exits to see how total clearance time responds. Planning aid only.</p>
      </div>}
      inspector={<div><Stat label="Evacuated" value={`${evac} / ${Math.round(count)}`} /><Stat label="Clear time" value={`${time.toFixed(1)} s`} /><Stat label="Exits" value={String(Math.round(exits))} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
