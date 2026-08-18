"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function MachConeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mach, setMach] = useState(2);

  const coneAngle = mach > 1 ? Math.asin(1 / mach) * 180 / Math.PI : 90;

  useEffect(() => {
    const W = 540, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cy = H / 2; const acx = W - 120;
    // expanding sound circles emitted along the path
    const speed = 60; const c = speed / mach;
    for (let k = 1; k <= 6; k++) { const emitX = acx - k * speed * 0.9; const r = k * c * 0.9; ctx.strokeStyle = "rgba(34,211,238,0.4)"; ctx.beginPath(); ctx.arc(emitX, cy, r, 0, 7); ctx.stroke(); }
    // Mach cone lines (if supersonic)
    if (mach > 1) { const ang = Math.asin(1 / mach); ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(acx, cy); ctx.lineTo(acx - W, cy - W * Math.tan(ang)); ctx.moveTo(acx, cy); ctx.lineTo(acx - W, cy + W * Math.tan(ang)); ctx.stroke(); }
    // aircraft
    ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.moveTo(acx + 14, cy); ctx.lineTo(acx - 12, cy - 7); ctx.lineTo(acx - 12, cy + 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(mach > 1 ? `Mach cone half-angle ${coneAngle.toFixed(1)}°` : "subsonic — sound outruns the aircraft", 16, 24);
  }, [mach]);

  return (
    <StudioChrome title="Mach Cone & Sonic Boom" tagline="supersonic shock geometry"
      controls={<div>
        <Slider label="Mach number" value={mach} min={0.3} max={5} step={0.1} onChange={setMach} />
        <p className="mt-3 text-xs text-slate-500">Below the speed of sound, pressure waves race ahead of an aircraft. At and above Mach 1 the aircraft outruns its own sound, and the waves pile into a cone-shaped shock — the sonic boom. The faster it flies, the more sharply swept the Mach cone: its half-angle is arcsin(1/M). This geometry governs supersonic and hypersonic vehicle design.</p>
      </div>}
      inspector={<div><Stat label="Mach" value={mach.toFixed(1)} /><Stat label="Regime" value={mach < 0.8 ? "subsonic" : mach < 1.2 ? "transonic" : mach < 5 ? "supersonic" : "hypersonic"} /><Stat label="Cone half-angle" value={mach > 1 ? `${coneAngle.toFixed(1)}°` : "—"} /></div>}
    ><canvas ref={canvasRef} width={540} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
