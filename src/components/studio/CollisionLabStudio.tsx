"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function CollisionLabStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [m1, setM1] = useState(2);
  const [m2, setM2] = useState(1);
  const [u1, setU1] = useState(3);
  const [u2, setU2] = useState(-1);
  const [e, setE] = useState(1);

  const v1 = (m1 * u1 + m2 * u2 - m2 * e * (u1 - u2)) / (m1 + m2);
  const v2 = (m1 * u1 + m2 * u2 + m1 * e * (u1 - u2)) / (m1 + m2);
  const keI = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
  const keF = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
  const st = useRef({ x1: 120, x2: 360, done: false, t: 0 });

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(canvasRef.current!, W, H); let raf = 0, last = 0;
    const s = st.current; s.x1 = 120; s.x2 = 360; s.done = false; s.t = 0;
    const loop = (t: number) => {
      const dt = last ? Math.min(0.03, (t - last) / 1000) : 0; last = t; s.t += dt; const sc = 30;
      const r1 = 10 + m1 * 4, r2 = 10 + m2 * 4;
      if (!s.done) { s.x1 += u1 * sc * dt; s.x2 += u2 * sc * dt; if (s.x1 + r1 >= s.x2 - r2) s.done = true; }
      else { s.x1 += v1 * sc * dt; s.x2 += v2 * sc * dt; }
      if (s.x1 < 0 || s.x2 > W || s.t > 6) { s.x1 = 120; s.x2 = 360; s.done = false; s.t = 0; }
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H); const gy = H / 2 + 30;
      ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      ctx.fillStyle = "#22d3ee"; ctx.fillRect(s.x1 - r1, gy - r1 * 2, r1 * 2, r1 * 2); ctx.fillStyle = "#f472b6"; ctx.fillRect(s.x2 - r2, gy - r2 * 2, r2 * 2, r2 * 2);
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`e=${e.toFixed(2)} · ${e >= 0.99 ? "elastic" : e <= 0.01 ? "perfectly inelastic" : "partially inelastic"}`, 12, 20);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [m1, m2, u1, u2, e, v1, v2]);

  return (
    <StudioChrome title="Collision Lab (1D)" tagline="momentum is always conserved"
      controls={<div>
        <Slider label="Mass 1 (kg)" value={m1} min={0.5} max={6} step={0.5} onChange={setM1} />
        <Slider label="Mass 2 (kg)" value={m2} min={0.5} max={6} step={0.5} onChange={setM2} />
        <Slider label="Velocity 1 (m/s)" value={u1} min={-5} max={5} step={0.5} onChange={setU1} />
        <Slider label="Velocity 2 (m/s)" value={u2} min={-5} max={5} step={0.5} onChange={setU2} />
        <Slider label="Restitution e" value={e} min={0} max={1} step={0.05} onChange={setE} />
        <p className="mt-3 text-xs text-slate-500">Momentum is conserved in every collision. Kinetic energy is conserved only when e=1 (perfectly elastic); at e=0 the carts stick together and the lost energy becomes heat and sound.</p>
      </div>}
      inspector={<div>
        <Stat label="Final v₁" value={`${v1.toFixed(2)} m/s`} />
        <Stat label="Final v₂" value={`${v2.toFixed(2)} m/s`} />
        <Stat label="KE before" value={`${keI.toFixed(1)} J`} />
        <Stat label="KE after" value={`${keF.toFixed(1)} J`} />
        <Stat label="Energy lost" value={keI > 0 ? `${(100 * (1 - keF / keI)).toFixed(0)}%` : "0%"} />
      </div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
