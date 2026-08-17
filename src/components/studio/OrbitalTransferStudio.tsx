"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 640, H = 480;

export function OrbitalTransferStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const [r1, setR1] = useState(90);
  const [r2, setR2] = useState(200);
  const [running, setRunning] = useState(true);
  const t = useRef(0);

  const { dv1, dv2, total } = useMemo(() => {
    const mu = 8000; const a = (r1 + r2) / 2;
    const v1 = Math.sqrt(mu / r1), v2 = Math.sqrt(mu / r2);
    const vp = Math.sqrt(mu * (2 / r1 - 1 / a)), va = Math.sqrt(mu * (2 / r2 - 1 / a));
    return { dv1: Math.abs(vp - v1), dv2: Math.abs(v2 - va), total: Math.abs(vp - v1) + Math.abs(v2 - va) };
  }, [r1, r2]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const cx = W / 2, cy = H / 2;
    const loop = () => {
      if (running) t.current += 0.01;
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(56,189,248,0.6)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r1, 0, 7); ctx.stroke();
      ctx.strokeStyle = "rgba(163,230,53,0.6)"; ctx.beginPath(); ctx.arc(cx, cy, r2, 0, 7); ctx.stroke();
      const a = (r1 + r2) / 2, b = Math.sqrt(r1 * r2), ec = cx - (a - r1);
      ctx.strokeStyle = "rgba(244,114,182,0.85)"; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.ellipse(ec, cy, a, b, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      const ang = t.current; const sx = cx + Math.cos(ang) * r1, sy = cy + Math.sin(ang) * r1; ctx.fillStyle = "#38bdf8"; ctx.beginPath(); ctx.arc(sx, sy, 6, 0, 7); ctx.fill();
      ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("Hohmann transfer ellipse (pink) between two circular orbits", 12, 22);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [r1, r2, running]);

  return (
    <StudioChrome title="Orbital Transfer (Hohmann)" tagline="minimum-energy orbit change"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button></div>
        <p className="mb-3 text-xs text-slate-500">The Hohmann transfer is the fuel-cheapest way between two circular orbits: one burn to enter the transfer ellipse, one to circularize. See the two Δv costs.</p>
        <Slider label="Inner orbit radius" value={r1} min={60} max={160} step={10} onChange={setR1} />
        <Slider label="Outer orbit radius" value={r2} min={120} max={230} step={10} onChange={setR2} />
      </div>}
      inspector={<div><Stat label="Δv burn 1" value={dv1.toFixed(2)} /><Stat label="Δv burn 2" value={dv2.toFixed(2)} /><Stat label="Total Δv" value={total.toFixed(2)} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[460px] rounded-lg" /></StudioChrome>
  );
}
