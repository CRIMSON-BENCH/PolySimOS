"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 760, H = 440;

export function BeatsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [f1, setF1] = useState(10);
  const [f2, setF2] = useState(11);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const pad = 30;
    const wave = (fn: (x: number) => number, color: string, midY: number, amp: number, lw: number) => { ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath(); for (let px = pad; px <= W - pad; px++) { const x = (px - pad) / (W - 2 * pad) * 4 * Math.PI; const y = midY - amp * fn(x); px === pad ? ctx.moveTo(px, y) : ctx.lineTo(px, y); } ctx.stroke(); };
    wave((x) => Math.sin(f1 * x), "rgba(34,211,238,0.35)", 90, 40, 1);
    wave((x) => Math.sin(f2 * x), "rgba(163,230,53,0.35)", 90, 40, 1);
    wave((x) => Math.sin(f1 * x) + Math.sin(f2 * x), "#e2e8f0", 300, 70, 2);
    // envelope
    ctx.strokeStyle = "rgba(244,114,182,0.7)"; ctx.setLineDash([4, 4]);
    for (const s of [1, -1]) { ctx.beginPath(); for (let px = pad; px <= W - pad; px++) { const x = (px - pad) / (W - 2 * pad) * 4 * Math.PI; const env = s * 2 * 70 * Math.abs(Math.cos((f2 - f1) / 2 * x)); px === pad ? ctx.moveTo(px, 300 - env) : ctx.lineTo(px, 300 - env); } ctx.stroke(); } ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("two tones (top) → sum with beat envelope (bottom)", 14, 22);
  }, [f1, f2]);

  return (
    <StudioChrome title="Beats & Superposition" tagline="two close frequencies interfere"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Two tones close in frequency add to a wave whose amplitude throbs at the difference frequency — the beats a musician hears when tuning.</p>
        <Slider label="Frequency 1" value={f1} min={5} max={20} step={0.5} onChange={setF1} />
        <Slider label="Frequency 2" value={f2} min={5} max={20} step={0.5} onChange={setF2} />
      </div>}
      inspector={<div><Stat label="f₁, f₂" value={`${f1}, ${f2}`} /><Stat label="Beat frequency" value={Math.abs(f2 - f1).toFixed(1)} /><Stat label="Effect" value="amplitude throb" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
