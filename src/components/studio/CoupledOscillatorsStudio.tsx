"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function CoupledOscillatorsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [k, setK] = useState(20);
  const [kc, setKc] = useState(8);
  const [m, setM] = useState(1);

  const w1 = Math.sqrt(k / m), w2 = Math.sqrt((k + 2 * kc) / m);
  const st = useRef({ x1: 1, x2: -0.3, v1: 0, v2: 0 });

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(canvasRef.current!, W, H); let raf = 0, last = 0;
    const loop = (t: number) => {
      const dt = last ? Math.min(0.03, (t - last) / 1000) : 0; last = t; const s = st.current;
      for (let i = 0; i < 4; i++) { const h = dt / 4; const a1 = (-k * s.x1 - kc * (s.x1 - s.x2)) / m; const a2 = (-k * s.x2 - kc * (s.x2 - s.x1)) / m; s.v1 += a1 * h; s.v2 += a2 * h; s.x1 += s.v1 * h; s.x2 += s.v2 * h; }
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const cy = H / 2, b1 = 160 + s.x1 * 50, b2 = 360 + s.x2 * 50;
      ctx.strokeStyle = "#334155"; ctx.lineWidth = 2;
      const spring = (x0: number, x1: number, y: number) => { ctx.beginPath(); ctx.moveTo(x0, y); const seg = 8; for (let i = 1; i < seg; i++) { const xx = x0 + (x1 - x0) * i / seg; ctx.lineTo(xx, y + (i % 2 ? -8 : 8)); } ctx.lineTo(x1, y); ctx.stroke(); };
      spring(20, b1 - 24, cy); spring(b1 + 24, b2 - 24, cy); spring(b2 + 24, W - 20, cy);
      ctx.fillStyle = "#22d3ee"; ctx.fillRect(b1 - 24, cy - 24, 48, 48); ctx.fillStyle = "#f472b6"; ctx.fillRect(b2 - 24, cy - 24, 48, 48);
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("two masses, three springs — energy sloshes between them", 12, 20);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [k, kc, m]);

  return (
    <StudioChrome title="Coupled Oscillators" tagline="normal modes & beating"
      controls={<div>
        <Slider label="Outer spring k (N/m)" value={k} min={2} max={50} step={1} onChange={setK} />
        <Slider label="Coupling spring (N/m)" value={kc} min={0} max={40} step={1} onChange={setKc} />
        <Slider label="Mass (kg)" value={m} min={0.5} max={4} step={0.1} onChange={setM} />
        <p className="mt-3 text-xs text-slate-500">Two masses linked by a spring exchange energy. Any motion is a mix of two normal modes: in-phase (slow) and out-of-phase (fast). Their beat produces the sloshing you see.</p>
      </div>}
      inspector={<div>
        <Stat label="Mode 1 (in-phase)" value={`${(w1 / (2 * Math.PI)).toFixed(3)} Hz`} />
        <Stat label="Mode 2 (out-of-phase)" value={`${(w2 / (2 * Math.PI)).toFixed(3)} Hz`} />
        <Stat label="Beat frequency" value={`${((w2 - w1) / (2 * Math.PI)).toFixed(3)} Hz`} />
      </div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
