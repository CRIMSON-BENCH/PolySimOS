"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function PitotTubeStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [dp, setDp] = useState(1500), [alt, setAlt] = useState(0);
  const rho = 1.225 * Math.exp(-alt / 8500);
  const vTrue = Math.sqrt(2 * dp / rho);
  const vIAS = Math.sqrt(2 * dp / 1.225);
  const mach = vTrue / Math.sqrt(1.4 * 287 * (288.15 - 0.0065 * Math.min(alt, 11000)));

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cy = H / 2;
    // pitot tube
    ctx.strokeStyle = "#64748b"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(360, cy); ctx.lineTo(430, cy); ctx.stroke();
    ctx.fillStyle = "#334155"; ctx.beginPath(); ctx.arc(360, cy, 10, 0, Math.PI * 2); ctx.fill();
    // incoming streamlines, length ~ speed
    const sp = Math.min(1, vTrue / 250);
    ctx.strokeStyle = "#22d3ee"; for (let s = -3; s <= 3; s++) { const y = cy + s * 22; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(60 + sp * 240, y); ctx.lineTo(52 + sp * 240, y - 5); ctx.moveTo(60 + sp * 240, y); ctx.lineTo(52 + sp * 240, y + 5); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`airspeed ${(vTrue * 3.6).toFixed(0)} km/h · Mach ${mach.toFixed(2)}`, 30, 26);
  }, [dp, alt, vTrue, mach]);

  return (
    <StudioChrome title="Pitot-Tube Airspeed" tagline="how planes measure speed"
      controls={<div>
        <Slider label="Dynamic pressure Δp (Pa)" value={dp} min={100} max={20000} step={100} onChange={setDp} />
        <Slider label="Altitude (m)" value={alt} min={0} max={12000} step={250} onChange={setAlt} />
        <p className="mt-3 text-xs text-slate-500">A pitot tube measures the pressure difference between still and moving air, then airspeed follows from v = √(2Δp/ρ). Because air thins with altitude, true airspeed exceeds the indicated value up high — a key gotcha in aviation. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Air density" value={`${rho.toFixed(3)} kg/m³`} />
        <Stat label="True airspeed" value={`${vTrue.toFixed(1)} m/s`} />
        <Stat label="Indicated airspeed" value={`${vIAS.toFixed(1)} m/s`} />
        <Stat label="Mach number" value={mach.toFixed(3)} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
