"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Magnus effect: a spinning ball curves.
export function MagnusStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spin, setSpin] = useState(30); // rev/s (sign = direction)
  const [speed, setSpeed] = useState(25); // m/s
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return; let raf = 0;
    const loop = () => {
      const W = 540, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#0b2818"; ctx.fillRect(0, 0, W, H);
      // pitch lines
      ctx.strokeStyle = "#1a4a2e"; for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
      // trajectory: x forward, lateral deflection from Magnus
      let x = 30, y = H / 2, vy = 0; const vx = speed; const dt = 0.02; const magnus = spin * 0.02;
      ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y);
      const trail: [number, number][] = [];
      for (let t = 0; t < 200; t++) { const ay = magnus * vx; vy += ay * dt; x += vx * dt * 8; y += vy * dt * 8; if (x > W - 20 || y < 10 || y > H - 10) break; trail.push([x, y]); }
      trail.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
      // straight reference
      ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(30, H / 2); ctx.lineTo(W - 20, H / 2); ctx.stroke(); ctx.setLineDash([]);
      // ball
      if (trail.length) { const [bx, by] = trail[trail.length - 1]; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(bx, by, 8, 0, 7); ctx.fill(); }
      ctx.fillStyle = "#a3e635"; ctx.font = "11px sans-serif"; ctx.fillText(`${spin > 0 ? "topspin/curve" : "backspin/curve"} — dashed = no-spin path`, 12, 20);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [spin, speed, running]);

  return (
    <StudioChrome title="Magnus Effect (Ball Spin)" tagline="the curve of a free kick"
      controls={<div>
        <Slider label="Spin (rev/s)" value={spin} min={-60} max={60} step={2} onChange={setSpin} />
        <Slider label="Ball speed (m/s)" value={speed} min={10} max={45} step={1} onChange={setSpeed} />
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">A spinning ball drags air around with it, moving faster on one side and slower on the other. The pressure difference pushes the ball sideways — the Magnus force — bending its flight. It is what curves a free kick around a wall, hooks a golf drive, and makes a curveball break. More spin means a sharper curve.</p>
      </div>}
      inspector={<div><Stat label="Spin" value={`${Math.abs(spin)} rev/s`} /><Stat label="Direction" value={spin > 0 ? "curves down/right" : spin < 0 ? "curves up/left" : "straight"} /><Stat label="Speed" value={`${speed} m/s`} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
