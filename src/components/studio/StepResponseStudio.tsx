"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function StepResponseStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [zeta, setZeta] = useState(0.4), [wn, setWn] = useState(3);
  const y = (t: number) => { if (zeta < 1) { const wd = wn * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * wn * t) * (Math.cos(wd * t) + zeta / Math.sqrt(1 - zeta * zeta) * Math.sin(wd * t)); } if (zeta === 1) return 1 - Math.exp(-wn * t) * (1 + wn * t); const s1 = -wn * (zeta - Math.sqrt(zeta * zeta - 1)), s2 = -wn * (zeta + Math.sqrt(zeta * zeta - 1)); return 1 - (s1 * Math.exp(s2 * t) - s2 * Math.exp(s1 * t)) / (s1 - s2); };
  const overshoot = zeta < 1 ? Math.exp(-Math.PI * zeta / Math.sqrt(1 - zeta * zeta)) * 100 : 0;
  const settling = 4 / (zeta * wn), tpeak = zeta < 1 ? Math.PI / (wn * Math.sqrt(1 - zeta * zeta)) : 0;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 30, pw = W - 55, ph = H - 55, tmax = 12;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); const sy = oy - (1 / 1.7) * ph; ctx.beginPath(); ctx.moveTo(ox, sy); ctx.lineTo(ox + pw, sy); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const t = tmax * i / pw; const yy = oy - (y(t) / 1.7) * ph; i ? ctx.lineTo(ox + i, yy) : ctx.moveTo(ox + i, yy); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("second-order step response", ox + 6, oy - ph + 12); ctx.fillText("time →", ox + pw - 44, oy + 18);
  }, [zeta, wn]);

  return (
    <StudioChrome title="Second-Order Step Response" tagline="damping shapes the response"
      controls={<div>
        <Slider label="Damping ratio ζ" value={zeta} min={0.05} max={2} step={0.05} onChange={setZeta} />
        <Slider label="Natural frequency ωₙ" value={wn} min={0.5} max={8} step={0.5} onChange={setWn} />
        <p className="mt-3 text-xs text-slate-500">A second-order system&apos;s response to a step is set entirely by its damping ratio and natural frequency. Low damping overshoots and rings; ζ = 1 is the fastest response without overshoot; high damping is sluggish. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Overshoot" value={`${overshoot.toFixed(0)}%`} />
        <Stat label="Settling time (2%)" value={`${settling.toFixed(2)} s`} />
        <Stat label="Peak time" value={zeta < 1 ? `${tpeak.toFixed(2)} s` : "—"} />
        <Stat label="Regime" value={zeta < 1 ? "underdamped" : zeta === 1 ? "critical" : "overdamped"} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
