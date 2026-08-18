"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { kp: number; kd: number; wind: number }> = {
  "Snappy": { kp: 2.5, kd: 1.8, wind: 0.3 },
  "Sluggish": { kp: 0.5, kd: 2.6, wind: 0.3 },
  "Oscillatory": { kp: 3, kd: 0.4, wind: 0.3 },
  "Windy day": { kp: 2, kd: 1.6, wind: 1.5 },
};

// 2D planar quadcopter with PID position + attitude control to a target.
export function QuadcopterStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ kp, kd, wind }, update] = useShareableNumbers({ kp: 1.0, kd: 1.4, wind: 0.3 });
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

  const explain =
    kd < 0.8
      ? `Low derivative gain (Kd=${kd}) gives little damping, so the drone overshoots and oscillates around the waypoint.`
      : kd > kp * 2
      ? `Heavy derivative gain (Kd=${kd}) over-damps the response, so the drone drifts sluggishly toward the target.`
      : wind > 1
      ? `Strong wind gusts (${wind}) constantly disturb the drone; the PID loop fights back but steady-state error grows.`
      : `Balanced gains (Kp=${kp}, Kd=${kd}) give a snappy, stable approach with minimal overshoot.`;

  const code = `import numpy as np
kp, kd, wind = ${kp}, ${kd}, ${wind}
g, dt, m = 0.35, 1.0, 1.0
x, y, vx, vy, th, om = 270., 300., 0., 0., 0., 0.
tx, ty = 270., 150.
for _ in range(400):
    ex, ey = tx - x, ty - y
    thrust = g*m + (kp*0.02*ey + kd*0.5*-vy)
    thDes = np.clip(-(kp*0.006*ex + kd*0.15*-vx), -0.5, 0.5)
    torque = 0.4*(thDes - th) - 0.5*om
    om += torque*dt; th += om*dt
    T = max(0.0, thrust)
    vx += (T*np.sin(th)) * dt; vy += (-T*np.cos(th) + g) * dt
    x += vx*dt; y += vy*dt
print("final pos", round(x, 1), round(y, 1))`;

  return (
    <StudioChrome title="Quadcopter Flight Control" tagline="PID position & attitude hold"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Proportional Kp" value={kp} min={0.2} max={3} step={0.1} onChange={(v) => update({ kp: v })} />
        <Slider label="Derivative Kd" value={kd} min={0.2} max={3} step={0.1} onChange={(v) => update({ kd: v })} />
        <Slider label="Wind gusts" value={wind} min={0} max={2} step={0.1} onChange={(v) => update({ wind: v })} />
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">A quadcopter holds position with nested control loops: an outer loop turns position error into a desired tilt and thrust, and an inner loop drives the attitude to that tilt. Tune the PID gains for a snappy, stable response — too little derivative and it oscillates, too much and it sluggishly drifts. Click to send a waypoint.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Tilt angle" value={`${(st.current.th * 180 / Math.PI).toFixed(1)}°`} />
        <Stat label="Speed" value={Math.hypot(st.current.vx, st.current.vy).toFixed(2)} />
        <Stat label="Control" value="nested PID" />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={540} height={400} onClick={(e) => { const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); target.current = [(e.clientX - r.left) * 540 / r.width, (e.clientY - r.top) * 400 / r.height]; }} className="mx-auto h-auto max-w-full cursor-crosshair rounded-lg" /></StudioChrome>
  );
}
