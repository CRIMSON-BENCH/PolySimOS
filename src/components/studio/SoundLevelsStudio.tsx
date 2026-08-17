"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Decibel addition + inverse-square distance falloff.
export function SoundLevelsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState(85); // dB at 1 m per source
  const [sources, setSources] = useState(1);
  const [distance, setDistance] = useState(4); // m

  const combined = level + 10 * Math.log10(Math.round(sources)); // incoherent sum
  const atDist = combined - 20 * Math.log10(distance); // inverse square (point source)

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 260; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 35, pw = W - 60, ph = H - 55; const dMax = 40;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 1; i <= pw; i++) { const d = (i / pw) * dMax; const lvl = combined - 20 * Math.log10(Math.max(0.5, d)); const y = oy - ((lvl - 20) / 100) * ph; i === 1 ? ctx.moveTo(ox + i, y) : ctx.lineTo(ox + i, y); } ctx.stroke();
    const xm = ox + (distance / dMax) * pw; const ym = oy - ((atDist - 20) / 100) * ph;
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(xm, ym, 5, 0, 7); ctx.fill();
    // 85 dB hearing-risk line
    ctx.strokeStyle = "#fbbf24"; ctx.setLineDash([4, 4]); const y85 = oy - ((85 - 20) / 100) * ph; ctx.beginPath(); ctx.moveTo(ox, y85); ctx.lineTo(ox + pw, y85); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("SPL vs distance", ox + 6, oy - ph + 12); ctx.fillStyle = "#fde68a"; ctx.fillText("85 dB (risk)", ox + pw - 70, y85 - 4); ctx.fillStyle = "#94a3b8"; ctx.fillText("distance (m) →", ox + pw - 90, oy + 16);
  }, [level, sources, distance, combined, atDist]);

  return (
    <StudioChrome title="Sound Levels (dB SPL)" tagline="adding & spreading loudness"
      controls={<div>
        <Slider label="Level per source at 1 m (dB)" value={level} min={40} max={110} step={1} onChange={setLevel} />
        <Slider label="Number of sources" value={sources} min={1} max={20} step={1} onChange={setSources} />
        <Slider label="Distance (m)" value={distance} min={1} max={40} step={1} onChange={setDistance} />
        <p className="mt-3 text-xs text-slate-500">Decibels are logarithmic, so loudness does not add the way you expect: two identical sources are only 3 dB louder than one, and ten are 10 dB. Meanwhile a point source drops 6 dB every time the distance doubles (the inverse-square law). Sustained exposure above 85 dB risks hearing damage.</p>
      </div>}
      inspector={<div><Stat label="Combined at 1 m" value={`${combined.toFixed(1)} dB`} /><Stat label={`At ${distance} m`} value={`${atDist.toFixed(1)} dB`} /><Stat label="Doubling sources" value="+3 dB" /><Stat label="Risk" value={atDist >= 85 ? "above 85 dB" : "safe range"} /></div>}
    ><canvas ref={canvasRef} width={520} height={260} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
