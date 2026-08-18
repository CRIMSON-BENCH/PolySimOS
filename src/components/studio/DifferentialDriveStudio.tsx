"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Differential-drive (unicycle) robot kinematics.
export function DifferentialDriveStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [vL, setVL] = useState(2.2);
  const [vR, setVR] = useState(2.8);
  const [running, setRunning] = useState(true);
  const state = useRef({ x: 270, y: 200, th: 0 });
  const trail = useRef<[number, number][]>([]);

  const reset = () => { state.current = { x: 270, y: 200, th: 0 }; trail.current = []; };

  useEffect(() => {
    if (!running) return; let raf = 0; const b = 20; // wheelbase
    const ctx = hidpi(canvasRef.current!, 540, 400);
    const loop = () => {
      const s = state.current; const v = (vR + vL) / 2 * 1.5; const w = (vR - vL) / b * 1.5;
      s.th += w; s.x += v * Math.cos(s.th); s.y += v * Math.sin(s.th);
      if (s.x < 10) s.x = 10; if (s.x > 530) s.x = 530; if (s.y < 10) s.y = 10; if (s.y > 390) s.y = 390;
      trail.current.push([s.x, s.y]); if (trail.current.length > 900) trail.current.shift();
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 540, 400);
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 1.5; ctx.beginPath(); trail.current.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
      // robot body
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.th); ctx.fillStyle = "#f472b6"; ctx.fillRect(-14, -11, 28, 22); ctx.fillStyle = "#334155"; ctx.fillRect(-14, -14, 28, 4); ctx.fillRect(-14, 10, 28, 4);
      ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(6, -6); ctx.lineTo(6, 6); ctx.fill(); ctx.restore();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, vL, vR]);

  const R = vL !== vR ? ((vR + vL) / 2) / ((vR - vL) / 20) : Infinity;

  return (
    <StudioChrome title="Differential Drive Robot" tagline="wheel speeds → path"
      controls={<div>
        <Slider label="Left wheel speed" value={vL} min={-4} max={4} step={0.1} onChange={setVL} />
        <Slider label="Right wheel speed" value={vR} min={-4} max={4} step={0.1} onChange={setVR} />
        <div className="mt-3 flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
        <p className="mt-3 text-xs text-slate-500">A differential-drive robot steers by spinning its two wheels at different speeds — like a tank. Equal speeds go straight, a difference curves the path, and opposite speeds spin in place. Its forward speed is the average of the wheels and its turn rate is their difference over the wheelbase.</p>
      </div>}
      inspector={<div><Stat label="Forward v" value={((vR + vL) / 2).toFixed(2)} /><Stat label="Turn rate ω" value={((vR - vL) / 20).toFixed(3)} /><Stat label="Turn radius" value={isFinite(R) ? R.toFixed(0) : "straight"} /></div>}
    ><canvas ref={canvasRef} width={540} height={400} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
