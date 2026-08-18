"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { m1: number; m2: number; u1: number; u2: number; e: number }> = {
  "Elastic swap": { m1: 2, m2: 2, u1: 3, u2: 0, e: 1 },
  "Perfectly inelastic": { m1: 2, m2: 1, u1: 3, u2: -1, e: 0 },
  "Heavy vs light": { m1: 6, m2: 0.5, u1: 4, u2: 0, e: 1 },
  "Head-on elastic": { m1: 2, m2: 1, u1: 4, u2: -4, e: 1 },
};

export function CollisionLabStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ m1, m2, u1, u2, e }, update] = useShareableNumbers({ m1: 2, m2: 1, u1: 3, u2: -1, e: 1 });

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

  const lostPct = keI > 0 ? (100 * (1 - keF / keI)).toFixed(0) : "0";
  const explain =
    e >= 0.99
      ? Math.abs(m1 - m2) < 0.01
        ? "Equal masses in an elastic collision simply exchange velocities — each cart leaves with the other cart old speed."
        : "This collision is elastic (e=1), so kinetic energy is fully conserved; momentum-sharing only redistributes the speeds between the two masses."
      : e <= 0.01
      ? `Perfectly inelastic (e=0): the carts stick and move as one, losing ${lostPct}% of the kinetic energy to heat and sound while momentum stays conserved.`
      : `Partially inelastic (e=${e.toFixed(2)}): momentum is conserved but ${lostPct}% of the kinetic energy is lost — the higher e, the bouncier the rebound.`;

  const code = `m1, m2, u1, u2, e = ${m1}, ${m2}, ${u1}, ${u2}, ${e}
v1 = (m1*u1 + m2*u2 - m2*e*(u1 - u2)) / (m1 + m2)
v2 = (m1*u1 + m2*u2 + m1*e*(u1 - u2)) / (m1 + m2)
keI = 0.5*m1*u1**2 + 0.5*m2*u2**2
keF = 0.5*m1*v1**2 + 0.5*m2*v2**2
print("v1", v1, "v2", v2, "energy lost %", 100*(1 - keF/keI))`;

  return (
    <StudioChrome title="Collision Lab (1D)" tagline="momentum is always conserved"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Mass 1 (kg)" value={m1} min={0.5} max={6} step={0.5} onChange={(v) => update({ m1: v })} />
        <Slider label="Mass 2 (kg)" value={m2} min={0.5} max={6} step={0.5} onChange={(v) => update({ m2: v })} />
        <Slider label="Velocity 1 (m/s)" value={u1} min={-5} max={5} step={0.5} onChange={(v) => update({ u1: v })} />
        <Slider label="Velocity 2 (m/s)" value={u2} min={-5} max={5} step={0.5} onChange={(v) => update({ u2: v })} />
        <Slider label="Restitution e" value={e} min={0} max={1} step={0.05} onChange={(v) => update({ e: v })} />
        <p className="mt-3 text-xs text-slate-500">Momentum is conserved in every collision. Kinetic energy is conserved only when e=1 (perfectly elastic); at e=0 the carts stick together and the lost energy becomes heat and sound.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Final v₁" value={`${v1.toFixed(2)} m/s`} />
        <Stat label="Final v₂" value={`${v2.toFixed(2)} m/s`} />
        <Stat label="KE before" value={`${keI.toFixed(1)} J`} />
        <Stat label="KE after" value={`${keF.toFixed(1)} J`} />
        <Stat label="Energy lost" value={keI > 0 ? `${(100 * (1 - keF / keI)).toFixed(0)}%` : "0%"} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
