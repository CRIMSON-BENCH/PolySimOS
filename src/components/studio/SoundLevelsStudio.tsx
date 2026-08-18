"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { level: number; sources: number; distance: number }> = {
  "Rock concert": { level: 105, sources: 1, distance: 5 },
  "Two speakers": { level: 90, sources: 2, distance: 3 },
  "Factory floor": { level: 95, sources: 8, distance: 10 },
  "Quiet office": { level: 55, sources: 1, distance: 4 },
};

// Decibel addition + inverse-square distance falloff.
export function SoundLevelsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ level, sources, distance }, update] = useShareableNumbers({ level: 85, sources: 1, distance: 4 });

  const combined = level + 10 * Math.log10(Math.round(sources)); // incoherent sum
  const atDist = combined - 20 * Math.log10(distance); // inverse square (point source)

  useEffect(() => {
    const W = 520, H = 260; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
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

  const explain =
    atDist >= 85
      ? `At ${distance} m the level is still ${atDist.toFixed(0)} dB — above the 85 dB risk line, so sustained exposure here is hazardous.`
      : sources > 1
      ? `The ${Math.round(sources)} sources add incoherently to ${combined.toFixed(0)} dB at 1 m, then the inverse-square law brings it down to a safer ${atDist.toFixed(0)} dB by ${distance} m.`
      : `A single source falls from ${combined.toFixed(0)} dB to ${atDist.toFixed(0)} dB across ${distance} m — about 6 dB lost each time the distance doubles.`;

  const code = `import numpy as np
level, sources, distance = ${level}, ${Math.round(sources)}, ${distance}
combined = level + 10*np.log10(sources)      # incoherent sum
at_dist = combined - 20*np.log10(distance)   # inverse-square falloff
print("combined", round(combined, 1), "at_dist", round(at_dist, 1))`;

  return (
    <StudioChrome title="Sound Levels (dB SPL)" tagline="adding & spreading loudness"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Level per source at 1 m (dB)" value={level} min={40} max={110} step={1} onChange={(v) => update({ level: v })} />
        <Slider label="Number of sources" value={sources} min={1} max={20} step={1} onChange={(v) => update({ sources: v })} />
        <Slider label="Distance (m)" value={distance} min={1} max={40} step={1} onChange={(v) => update({ distance: v })} />
        <p className="mt-3 text-xs text-slate-500">Decibels are logarithmic, so loudness does not add the way you expect: two identical sources are only 3 dB louder than one, and ten are 10 dB. Meanwhile a point source drops 6 dB every time the distance doubles (the inverse-square law). Sustained exposure above 85 dB risks hearing damage.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Combined at 1 m" value={`${combined.toFixed(1)} dB`} /><Stat label={`At ${distance} m`} value={`${atDist.toFixed(1)} dB`} /><Stat label="Doubling sources" value="+3 dB" /><Stat label="Risk" value={atDist >= 85 ? "above 85 dB" : "safe range"} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={260} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
