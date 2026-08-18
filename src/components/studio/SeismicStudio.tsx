"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { mag: number; distance: number }> = {
  "Minor (M4 @ 50km)": { mag: 4, distance: 50 },
  "Moderate (M6 @ 30km)": { mag: 6, distance: 30 },
  "Major (M7.5 @ 20km)": { mag: 7.5, distance: 20 },
  "Great (M9 @ 100km)": { mag: 9, distance: 100 },
};

export function SeismicStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ mag, distance }, update] = useShareableNumbers({ mag: 6.0, distance: 30 });

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

  const explain = pga > 34
    ? `At ${distance} km an M${mag} quake delivers ~${pga.toFixed(0)}%g — intensity ${mercalli}. Shaking this strong causes serious structural damage; energy release is ${energyJ.toExponential(1)} J.`
    : pga < 3.9
    ? `${distance} km out, an M${mag} quake attenuates to only ~${pga.toFixed(1)}%g — intensity ${mercalli}, felt but rarely damaging. Distance and the log falloff tame most of the ${energyJ.toExponential(1)} J released.`
    : `An M${mag} event ${distance} km away yields ~${pga.toFixed(1)}%g — intensity ${mercalli}. Each +1 magnitude releases about 32× more energy, so small magnitude changes shift the felt shaking sharply.`;

  const code = `import numpy as np
mag, distance = ${mag}, ${distance}  # Mw, km
energy_J = 10**(1.5*mag + 4.8)            # Gutenberg-Richter
tnt_tons = energy_J / 4.184e9
pga = 10**(0.43*mag - 1.4*np.log10(distance + 10) - 0.9)  # %g
print("energy (J):", energy_J)
print("TNT equivalent (tons):", tnt_tons)
print("peak ground accel (%g):", pga)`;

  return (
    <StudioChrome title="Earthquake Magnitude & Shaking" tagline="energy · attenuation · intensity"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Moment magnitude Mw" value={mag} min={2} max={9.5} step={0.1} onChange={(v) => update({ mag: v })} />
        <Slider label="Distance from epicenter (km)" value={distance} min={1} max={300} step={1} onChange={(v) => update({ distance: v })} />
        <p className="mt-3 text-xs text-slate-500">Magnitude is logarithmic in amplitude but each unit releases about 32× more energy (E ∝ 10^1.5M). Shaking at a site falls off with distance through attenuation. Peak ground acceleration maps to the Modified Mercalli intensity people actually feel — a planning estimate, not a site-specific hazard analysis.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Energy" value={`${energyJ.toExponential(2)} J`} /><Stat label="TNT equivalent" value={tntTons > 1e6 ? `${(tntTons / 1e6).toFixed(1)} Mt` : `${(tntTons / 1e3).toFixed(1)} kt`} /><Stat label="Peak accel." value={`${pga.toFixed(1)} %g`} /><Stat label="Intensity" value={mercalli} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={480} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
