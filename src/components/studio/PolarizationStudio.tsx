"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Malus's law through a chain of polarizers.
export function PolarizationStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angles, setAngles] = useState([0, 45, 90]);

  let intensity = 0.5; const outs = [0.5]; // after first polarizer, unpolarized -> 50%
  for (let i = 1; i < angles.length; i++) { const d = (angles[i] - angles[i - 1]) * Math.PI / 180; intensity *= Math.cos(d) ** 2; outs.push(intensity); }

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 540, H = 220; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const n = angles.length; const spacing = W / (n + 1);
    // beam
    ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = Math.max(2, outs[0] * 20); ctx.beginPath(); ctx.moveTo(10, H / 2); ctx.lineTo(spacing, H / 2); ctx.stroke();
    for (let i = 0; i < n; i++) { const x = spacing * (i + 1); ctx.strokeStyle = "#64748b"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, H / 2, 30, 0, 7); ctx.stroke();
      const a = angles[i] * Math.PI / 180; ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 28, H / 2 + Math.sin(a) * 28); ctx.lineTo(x + Math.cos(a) * 28, H / 2 - Math.sin(a) * 28); ctx.stroke();
      const nextX = spacing * (i + 2); ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = Math.max(1, outs[i] * 20); ctx.beginPath(); ctx.moveTo(x + 30, H / 2); ctx.lineTo(Math.min(nextX - 30, W - 10), H / 2); ctx.stroke();
      ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText(`${angles[i]}°`, x - 10, H / 2 + 46); ctx.fillText(`${(outs[i] * 100).toFixed(0)}%`, x + 34, H / 2 - 8); }
  }, [angles]);

  const setA = (i: number, v: number) => setAngles((arr) => arr.map((x, j) => j === i ? v : x));
  return (
    <StudioChrome title="Polarization (Malus's Law)" tagline="filtering light waves"
      controls={<div>
        {angles.map((a, i) => <Slider key={i} label={`Polarizer ${i + 1} angle (°)`} value={a} min={0} max={180} step={5} onChange={(v) => setA(i, v)} />)}
        <p className="mt-3 text-xs text-slate-500">A polarizer only passes the light-wave component aligned with its axis. Malus&apos;s law says the transmitted intensity is I₀·cos²θ, where θ is the angle between successive filters. Two crossed polarizers block everything — but slip a third at 45° between them and light reappears, a striking quantum-like result of projection.</p>
      </div>}
      inspector={<div><Stat label="Final intensity" value={`${(intensity * 100).toFixed(1)}%`} /><Stat label="Polarizers" value={String(angles.length)} /><Stat label="Crossed?" value={Math.abs(angles[angles.length - 1] - angles[0]) === 90 && angles.length === 2 ? "yes (dark)" : "no"} /></div>}
    ><canvas ref={canvasRef} width={540} height={220} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
