"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Sabine reverberation time: RT60 = 0.161 V / (S * alpha).
export function ReverbTimeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [volume, setVolume] = useState(200); // m^3
  const [area, setArea] = useState(220); // m^2 surface
  const [alpha, setAlpha] = useState(0.15); // avg absorption

  const A = area * alpha; const rt60 = 0.161 * volume / A;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 280; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 40, pw = W - 60, ph = H - 60; const tMax = 3;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // decay: level drops 60 dB over RT60
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= pw; i++) { const t = (i / pw) * tMax; const db = -60 * t / rt60; const y = oy - ((db + 70) / 70) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    // -60 dB marker
    ctx.strokeStyle = "#f472b6"; ctx.setLineDash([4, 4]); const y60 = oy - ((-60 + 70) / 70) * ph; ctx.beginPath(); ctx.moveTo(ox, y60); ctx.lineTo(ox + pw, y60); ctx.stroke();
    const xr = ox + (Math.min(rt60, tMax) / tMax) * pw; ctx.beginPath(); ctx.moveTo(xr, oy); ctx.lineTo(xr, oy - ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("sound decay (dB)", ox + 6, oy - ph + 12); ctx.fillStyle = "#f9a8d4"; ctx.fillText("−60 dB", ox + pw - 44, y60 - 4); ctx.fillText(`RT60 = ${rt60.toFixed(2)}s`, xr - 30, oy + 16);
  }, [volume, area, alpha, rt60]);

  const verdict = rt60 < 0.5 ? "dry (studio)" : rt60 < 1.2 ? "good (living room)" : rt60 < 2.2 ? "live (hall)" : "very reverberant";
  return (
    <StudioChrome title="Reverberation Time (Sabine)" tagline="how long sound lingers"
      controls={<div>
        <Slider label="Room volume (m³)" value={volume} min={30} max={2000} step={10} onChange={setVolume} />
        <Slider label="Surface area (m²)" value={area} min={50} max={2000} step={10} onChange={setArea} />
        <Slider label="Avg absorption α" value={alpha} min={0.05} max={0.9} step={0.05} onChange={setAlpha} />
        <p className="mt-3 text-xs text-slate-500">Reverberation time — how long a sound takes to decay by 60 dB — is set by Sabine&apos;s formula RT60 = 0.161·V/(S·α). Big, hard rooms ring for seconds; small, soft rooms deaden almost instantly. Concert halls target around 2 seconds; recording studios far less. Adding absorption pulls the decay down.</p>
      </div>}
      inspector={<div><Stat label="RT60" value={`${rt60.toFixed(2)} s`} /><Stat label="Absorption A" value={`${A.toFixed(0)} sabins`} /><Stat label="Character" value={verdict} /></div>}
    ><canvas ref={canvasRef} width={520} height={280} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
