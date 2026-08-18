"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function DrivenResonanceStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [f0, setF0] = useState(1.0);
  const [damp, setDamp] = useState(0.15);
  const [drive, setDrive] = useState(1.0);

  const w0 = 2 * Math.PI * f0, gamma = 2 * damp * w0;
  const amp = (wd: number) => 1 / Math.sqrt(Math.pow(w0 * w0 - wd * wd, 2) + Math.pow(gamma * wd, 2));
  const A = amp(2 * Math.PI * drive), Q = 1 / (2 * damp);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const fmax = f0 * 3; let peak = 0; for (let i = 0; i <= pw; i++) peak = Math.max(peak, amp(2 * Math.PI * fmax * i / pw));
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= pw; i++) { const a = amp(2 * Math.PI * fmax * i / pw) / peak; const x = ox + i, y = oy - a * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    const dx = ox + (drive / fmax) * pw; ctx.strokeStyle = "#f472b6"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(dx, oy); ctx.lineTo(dx, oy - (A / peak) * ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("amplitude vs drive frequency (resonance curve)", ox + 6, oy - ph + 12); ctx.fillText("frequency →", ox + pw - 70, oy + 18);
  }, [f0, damp, drive]);

  return (
    <StudioChrome title="Driven Resonance" tagline="amplitude near the natural frequency"
      controls={<div>
        <Slider label="Natural frequency f₀ (Hz)" value={f0} min={0.3} max={3} step={0.1} onChange={setF0} />
        <Slider label="Damping ratio ζ" value={damp} min={0.02} max={0.7} step={0.01} onChange={setDamp} />
        <Slider label="Drive frequency (Hz)" value={drive} min={0.05} max={6} step={0.05} onChange={setDrive} />
        <p className="mt-3 text-xs text-slate-500">Push a swing at its natural frequency and the amplitude blows up — resonance. Less damping → a taller, sharper peak (higher Q). This is why bridges, buildings, and wine glasses each have a frequency you must avoid.</p>
      </div>}
      inspector={<div>
        <Stat label="Response amplitude" value={A.toExponential(2)} />
        <Stat label="Quality factor Q" value={Q.toFixed(1)} />
        <Stat label="At resonance?" value={Math.abs(drive - f0) < 0.06 ? "yes ≈ peak" : "no"} />
      </div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
