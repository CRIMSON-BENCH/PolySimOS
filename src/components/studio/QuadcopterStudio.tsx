"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// 2D planar quadcopter with PID position + attitude control to a target.
export function QuadcopterStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [kp, setKp] = useState(1.0);
  const [kd, setKd] = useState(1.4);
  const [wind, setWind] = useState(0.3);
  const [running, setRunning] = useState(true);
  const st = useRef({ x: 270, y: 300, vx: 0, vy: 0, th: 0, om: 0 });
  const target = useRef<[number, number]>([270, 150]);

  useEffect(() => {
    if (!running) return; let raf = 0; let s = 9; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 - 0.5; };
    const g = 0.35, dt = 1, m = 1;
    const loop = () => {
      const p = st.current; const [tx, ty] = target.current;
      // outer position PID -> desired thrust & tilt
      const ex = tx - p.x, ey = ty - p.y;
      const thrust = g * m + (kp * 0.02 * ey + kd * 0.5 * -p.vy);
      const thDes = Math.max(-0.5, Math.min(0.5, -(kp * 0.006 * ex + kd * 0.15 * -p.vx)));
      const torque = 0.4 * (thDes - p.th) - 0.5 * p.om;
      p.om += torque * dt; p.th += p.om * dt;
      const T = Math.max(0, thrust);
      p.vx += (T * Math.sin(p.th) + rnd() * wind) * dt; p.vy += (-T * Math.cos(p.th) + g) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y > 380) { p.y = 380; p.vy = 0; } if (p.y < 20) { p.y = 20; p.vy = 0; }
      const ctx = hidpi(canvasRef.current!, 540, 400); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 540, 400);
      // target
      ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tx, ty, 10, 0, 7); ctx.stroke();
      // drone
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.th); ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(26, 0); ctx.stroke();
      ctx.fillStyle = "#f472b6"; [-26, 26].forEach((dx) => { ctx.fillRect(dx - 8, -6, 16, 4); }); ctx.fillStyle = "#a3e635"; ctx.fillRect(-6, -4, 12, 8); ctx.restore();
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("click to set a waypoint", 12, 20);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, kp, kd, wind]);

  return (
    <StudioChrome title="Quadcopter Flight Control" tagline="PID position & attitude hold"
      controls={<div>
        <Slider label="Proportional Kp" value={kp} min={0.2} max={3} step={0.1} onChange={setKp} />
        <Slider label="Derivative Kd" value={kd} min={0.2} max={3} step={0.1} onChange={setKd} />
        <Slider label="Wind gusts" value={wind} min={0} max={2} step={0.1} onChange={setWind} />
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">A quadcopter holds position with nested control loops: an outer loop turns position error into a desired tilt and thrust, and an inner loop drives the attitude to that tilt. Tune the PID gains for a snappy, stable response — too little derivative and it oscillates, too much and it sluggishly drifts. Click to send a waypoint.</p>
      </div>}
      inspector={<div><Stat label="Tilt angle" value={`${(st.current.th * 180 / Math.PI).toFixed(1)}°`} /><Stat label="Speed" value={Math.hypot(st.current.vx, st.current.vy).toFixed(2)} /><Stat label="Control" value="nested PID" /></div>}
    ><canvas ref={canvasRef} width={540} height={400} onClick={(e) => { const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); target.current = [(e.clientX - r.left) * 540 / r.width, (e.clientY - r.top) * 400 / r.height]; }} className="mx-auto h-auto max-w-full cursor-crosshair rounded-lg" /></StudioChrome>
  );
}
