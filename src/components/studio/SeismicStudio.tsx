"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function SeismicStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mag, setMag] = useState(6.0);
  const [distance, setDistance] = useState(30); // km

  const energyJ = Math.pow(10, 1.5 * mag + 4.8); // Gutenberg-Richter
  const tntTons = energyJ / 4.184e9;
  // simple PGA attenuation (%g): log10(PGA) = 0.3*M - 1.4*log10(R+10) - 1
  const pga = Math.pow(10, 0.43 * mag - 1.4 * Math.log10(distance + 10) - 0.9);
  const mercalli = pga > 65 ? "X+ Extreme" : pga > 34 ? "IX Violent" : pga > 18 ? "VIII Severe" : pga > 9.2 ? "VII Very strong" : pga > 3.9 ? "VI Strong" : pga > 1.4 ? "V Moderate" : "III-IV Light";

  useEffect(() => {
    const W = 480, H = 320; const ctx = hidpi(canvasRef.current!, W, H); const cx = 90, cy = H / 2; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // shaking rings scaled by magnitude
    const feltR = Math.pow(10, 0.5 * mag) * 0.6; const scale = (W - 120) / (feltR * 1.1 || 1);
    for (let i = 5; i >= 1; i--) { const r = feltR * (i / 5) * scale; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fillStyle = `rgba(249,115,22,${0.08 * i})`; ctx.fill(); ctx.strokeStyle = "rgba(249,115,22,0.4)"; ctx.stroke(); }
    ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 7); ctx.fill();
    // observer
    const ox = cx + distance * scale; if (ox < W - 10) { ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.arc(ox, cy, 5, 0, 7); ctx.fill(); ctx.fillStyle = "#e2e8f0"; ctx.font = "11px sans-serif"; ctx.fillText(`${distance} km`, ox - 12, cy - 12); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("epicenter", cx - 22, cy + 22);
  }, [mag, distance]);

  return (
    <StudioChrome title="Earthquake Magnitude & Shaking" tagline="energy · attenuation · intensity"
      controls={<div>
        <Slider label="Moment magnitude Mw" value={mag} min={2} max={9.5} step={0.1} onChange={setMag} />
        <Slider label="Distance from epicenter (km)" value={distance} min={1} max={300} step={1} onChange={setDistance} />
        <p className="mt-3 text-xs text-slate-500">Magnitude is logarithmic in amplitude but each unit releases about 32× more energy (E ∝ 10^1.5M). Shaking at a site falls off with distance through attenuation. Peak ground acceleration maps to the Modified Mercalli intensity people actually feel — a planning estimate, not a site-specific hazard analysis.</p>
      </div>}
      inspector={<div><Stat label="Energy" value={`${energyJ.toExponential(2)} J`} /><Stat label="TNT equivalent" value={tntTons > 1e6 ? `${(tntTons / 1e6).toFixed(1)} Mt` : `${(tntTons / 1e3).toFixed(1)} kt`} /><Stat label="Peak accel." value={`${pga.toFixed(1)} %g`} /><Stat label="Intensity" value={mercalli} /></div>}
    ><canvas ref={canvasRef} width={480} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
