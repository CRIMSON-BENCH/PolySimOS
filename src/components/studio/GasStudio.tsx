"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 480, H = 420;

const PRESETS: Record<string, { n: number; temp: number }> = {
  "Cold & sparse": { n: 40, temp: 1 },
  "Room conditions": { n: 120, temp: 3 },
  "Hot & dense": { n: 280, temp: 6.5 },
  "Near vacuum": { n: 20, temp: 2 },
};

export function GasStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const atoms = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  const frameRef = useRef(0);
  const [{ n, temp }, update] = useShareableNumbers({ n: 120, temp: 3 });
  const [pressure, setPressure] = useState(0);
  const wallHits = useRef(0);

  const seed = () => { atoms.current = Array.from({ length: n }, () => { const a = Math.random() * 7; return { x: 20 + Math.random() * (W - 40), y: 20 + Math.random() * (H - 40), vx: Math.cos(a) * temp, vy: Math.sin(a) * temp }; }); };
  useEffect(() => { seed(); /* eslint-disable-next-line */ }, [n]);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = hidpi(canvas, W, H);
    const A = atoms.current; const r = 4;
    for (let s = 0; s < steps; s++) {
      for (const p of A) { p.x += p.vx; p.y += p.vy;
        if (p.x < r) { p.x = r; p.vx = -p.vx; wallHits.current += Math.abs(p.vx); } if (p.x > W - r) { p.x = W - r; p.vx = -p.vx; wallHits.current += Math.abs(p.vx); }
        if (p.y < r) { p.y = r; p.vy = -p.vy; wallHits.current += Math.abs(p.vy); } if (p.y > H - r) { p.y = H - r; p.vy = -p.vy; wallHits.current += Math.abs(p.vy); } }
      for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) { const dx = A[j].x - A[i].x, dy = A[j].y - A[i].y; const d = Math.hypot(dx, dy); if (d > 0 && d < 2 * r) { const nx = dx / d, ny = dy / d; const p = (A[i].vx - A[j].vx) * nx + (A[i].vy - A[j].vy) * ny; A[i].vx -= p * nx; A[i].vy -= p * ny; A[j].vx += p * nx; A[j].vy += p * ny; const ov = 2 * r - d; A[i].x -= nx * ov / 2; A[i].y -= ny * ov / 2; A[j].x += nx * ov / 2; A[j].y += ny * ov / 2; } }
    }
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    for (const p of A) { const sp = Math.hypot(p.vx, p.vy); ctx.fillStyle = `hsl(${200 - Math.min(160, sp * 20)},90%,60%)`; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill(); }
    if (frameRef.current++ % 30 === 0) { setPressure(wallHits.current / 30); wallHits.current = 0; }
  };

  const t = useTransport(frame);

  useEffect(() => { for (const p of atoms.current) { const sp = Math.hypot(p.vx, p.vy) || 1; const a = Math.atan2(p.vy, p.vx); const nv = temp; p.vx = Math.cos(a) * nv; p.vy = Math.sin(a) * nv; void sp; } }, [temp]);

  const explain =
    n >= 240 && temp >= 5
      ? "Many fast particles: wall collisions are frequent and hard, so pressure runs high — n and T both push P up in PV = nRT."
      : temp <= 1.5
      ? "At low temperature molecules crawl, so each wall hit is gentle and pressure stays low even with plenty of particles."
      : n <= 40
      ? "Few particles means few collisions per second — pressure is low no matter how fast each one moves."
      : "Pressure scales with both particle count and temperature: doubling either roughly doubles the force on the walls (P ∝ nT).";

  const code = `import numpy as np
n, temp = ${n}, ${temp}
W, H, r, steps = ${W}, ${H}, 4, 1200
rng = np.random.default_rng(0)
pos = rng.uniform(20, [W-20, H-20], size=(n, 2))
ang = rng.uniform(0, 2*np.pi, n)
vel = np.c_[np.cos(ang), np.sin(ang)] * temp
wall = 0.0
for _ in range(steps):
    pos += vel
    for d, lim in ((0, W), (1, H)):
        lo = pos[:, d] < r; hi = pos[:, d] > lim - r
        wall += np.abs(vel[lo | hi, d]).sum()
        vel[lo | hi, d] *= -1
        pos[:, d] = np.clip(pos[:, d], r, lim - r)
print("wall impulse / step ~ pressure:", wall / steps)`;

  return (
    <StudioChrome title="Gas in a Box — Kinetic Theory" tagline="ideal gas · pressure from collisions"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { seed(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mb-3 text-xs text-slate-500">Pressure emerges from molecules hammering the walls. More particles or higher temperature → higher pressure, exactly as PV = nRT predicts.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Particles (n)" value={n} min={20} max={300} step={20} onChange={(v) => update({ n: v })} />
        <Slider label="Temperature" value={temp} min={0.5} max={7} step={0.5} onChange={(v) => update({ temp: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Particles" value={String(n)} /><Stat label="Temperature" value={temp.toFixed(1)} /><Stat label="Pressure (wall)" value={pressure.toFixed(0)} /><Stat label="Law" value="PV = nRT" /><Equation tex={`P\\,V = N k_B T,\\quad N=${n},\\ T=${temp.toFixed(1)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[440px] rounded-lg" /></StudioChrome>
  );
}
