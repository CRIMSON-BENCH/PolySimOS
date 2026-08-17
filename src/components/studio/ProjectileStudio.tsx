"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 760, H = 480;

export function ProjectileStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(45);
  const [speed, setSpeed] = useState(60);
  const [drag, setDrag] = useState(0.02);

  const traj = useMemo(() => {
    const rad = (angle * Math.PI) / 180; let x = 0, y = 0, vx = speed * Math.cos(rad), vy = speed * Math.sin(rad);
    const g = 30, dt = 0.02; const pts: [number, number][] = [[0, 0]];
    for (let i = 0; i < 2000 && y >= 0; i++) {
      const v = Math.hypot(vx, vy);
      vx += (-drag * v * vx) * dt; vy += (-g - drag * v * vy) * dt;
      x += vx * dt; y += vy * dt; if (y < 0) break; pts.push([x, y]);
    }
    return pts;
  }, [angle, speed, drag]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const maxX = Math.max(...traj.map((p) => p[0]), 10), maxY = Math.max(...traj.map((p) => p[1]), 10);
    const pad = 40; const sx = (x: number) => pad + (x / maxX) * (W - 2 * pad); const sy = (y: number) => H - pad - (y / maxY) * (H - 2 * pad);
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); traj.forEach((p, i) => i ? ctx.lineTo(sx(p[0]), sy(p[1])) : ctx.moveTo(sx(p[0]), sy(p[1]))); ctx.stroke();
    const last = traj[traj.length - 1]; ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(sx(last[0]), sy(last[1]), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`range ${maxX.toFixed(1)} m · apex ${maxY.toFixed(1)} m`, pad, 24);
  }, [traj]);

  const range = Math.max(...traj.map((p) => p[0])), apex = Math.max(...traj.map((p) => p[1]));

  return (
    <StudioChrome title="Projectile Motion Studio" tagline="ballistics with air drag"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Launch a projectile and see how angle, speed, and air resistance shape the arc.</p>
        <Slider label="Launch angle (°)" value={angle} min={5} max={85} step={1} onChange={setAngle} />
        <Slider label="Launch speed" value={speed} min={10} max={120} step={5} onChange={setSpeed} />
        <Slider label="Air drag" value={drag} min={0} max={0.1} step={0.005} onChange={setDrag} />
      </div>}
      inspector={<div><Stat label="Range" value={`${range.toFixed(1)} m`} /><Stat label="Max height" value={`${apex.toFixed(1)} m`} /><Stat label="Drag" value={drag === 0 ? "none (ideal)" : "quadratic"} /></div>}
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
