"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function LeadLagStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [zero, setZero] = useState(1), [pole, setPole] = useState(10);
  // C(s) = (1 + s/zero)/(1 + s/pole). lead if pole>zero (phase boost), lag if pole<zero
  const phase = (w: number) => (Math.atan(w / zero) - Math.atan(w / pole)) * 180 / Math.PI;
  let maxPhase = 0, wAtMax = 0; for (let i = 0; i < 400; i++) { const w = Math.pow(10, -2 + 5 * i / 400); const ph = phase(w); if (Math.abs(ph) > Math.abs(maxPhase)) { maxPhase = ph; wAtMax = w; } }

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H / 2 + 40, pw = W - 60, ph = H / 2, wmin = 0.01, wmax = 1000;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy - ph); ctx.lineTo(ox, oy + ph); ctx.stroke();
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const w = wmin * Math.pow(wmax / wmin, i / pw); const y = oy - (phase(w) / 90) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("compensator phase vs frequency (log)", ox + 6, 22); ctx.fillText(pole > zero ? "lead (phase boost)" : "lag (phase drop)", ox + 6, 40);
  }, [zero, pole]);

  return (
    <StudioChrome title="Lead–Lag Compensator" tagline="shaping phase for stability"
      controls={<div>
        <Slider label="Zero (rad/s)" value={zero} min={0.1} max={50} step={0.1} onChange={setZero} />
        <Slider label="Pole (rad/s)" value={pole} min={0.1} max={100} step={0.1} onChange={setPole} />
        <p className="mt-3 text-xs text-slate-500">A lead compensator (pole above zero) adds phase near the crossover to boost stability margins and speed; a lag compensator (pole below zero) trades phase to raise low-frequency gain and kill steady-state error. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Type" value={pole > zero ? "lead" : pole < zero ? "lag" : "none"} />
        <Stat label="Max phase shift" value={`${maxPhase.toFixed(0)}°`} />
        <Stat label="At frequency" value={`${wAtMax.toFixed(2)} rad/s`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
