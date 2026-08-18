"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { surfaceT: number; envLapse: number; moist: number }> = {
  "Calm & stable": { surfaceT: 18, envLapse: 5, moist: 5 },
  "Summer storms": { surfaceT: 30, envLapse: 8, moist: 5 },
  "Severe / supercell": { surfaceT: 35, envLapse: 9.5, moist: 4 },
  "Marginal": { surfaceT: 24, envLapse: 7, moist: 5.5 },
};

// Parcel vs environment: CAPE and stability.
export function AtmosphericStabilityStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ surfaceT, envLapse, moist }, update] = useShareableNumbers({ surfaceT: 28, envLapse: 7.5, moist: 5 });

  // parcel rises dry (9.8) to LCL then moist; simplify: parcel follows moist lapse from surface
  const envT = (z: number) => surfaceT - envLapse * z; const parcelT = (z: number) => surfaceT - moist * z;
  let cape = 0; for (let z = 0; z < 12; z += 0.1) { const diff = parcelT(z) - envT(z); if (diff > 0) cape += diff * 0.1; }
  cape = cape * 100; // rough scaling to J/kg-ish

  useEffect(() => {
    const W = 460, H = 360; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 30, ph = H - 50; const zMax = 12; const tMin = -40, tMax = 35;
    const X = (t: number) => ox + ((t - tMin) / (tMax - tMin)) * (W - 65); const Y = (z: number) => oy - (z / zMax) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(W - 20, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // CAPE shading
    ctx.fillStyle = "rgba(244,114,182,0.2)"; ctx.beginPath(); let started = false; for (let z = 0; z <= zMax; z += 0.1) { if (parcelT(z) > envT(z)) { const x = X(parcelT(z)), y = Y(z); started ? ctx.lineTo(x, y) : ctx.moveTo(x, y); started = true; } }
    for (let z = zMax; z >= 0; z -= 0.1) { if (parcelT(z) > envT(z)) ctx.lineTo(X(envT(z)), Y(z)); } ctx.fill();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let z = 0; z <= zMax; z += 0.2) { const y = Y(z); z === 0 ? ctx.moveTo(X(envT(z)), y) : ctx.lineTo(X(envT(z)), y); } ctx.stroke();
    ctx.strokeStyle = "#a3e635"; ctx.beginPath(); for (let z = 0; z <= zMax; z += 0.2) { const y = Y(z); z === 0 ? ctx.moveTo(X(parcelT(z)), y) : ctx.lineTo(X(parcelT(z)), y); } ctx.stroke();
    ctx.font = "11px sans-serif"; ctx.fillStyle = "#67e8f9"; ctx.fillText("environment", ox + 6, 18); ctx.fillStyle = "#bef264"; ctx.fillText("rising parcel", ox + 90, 18); ctx.fillStyle = "#94a3b8"; ctx.fillText("temp (°C) →", W - 90, oy + 16);
  }, [surfaceT, envLapse, moist]);

  const verdict = cape > 2500 ? "severe storms" : cape > 1000 ? "thunderstorms likely" : cape > 300 ? "marginal" : "stable";
  const explain =
    envLapse <= moist
      ? "The environment cools slower than the rising parcel, so the parcel is always colder and sinks back — an absolutely stable profile with no CAPE, and no storms."
      : cape > 2500
      ? `Steep environmental lapse (${envLapse.toFixed(1)} °C/km) keeps the parcel far warmer than its surroundings all the way up — huge CAPE fuels tall, violent updrafts.`
      : cape > 300
      ? `The parcel stays warmer than the environment over part of the climb, so it accelerates upward — that positive-buoyancy area is the ${cape.toFixed(0)} J/kg of CAPE driving convection.`
      : "Only a thin sliver of positive buoyancy exists here, so any updraft is weak — the atmosphere is close to stable and storms struggle to fire.";

  const code = `import numpy as np
surfaceT, envLapse, moist = ${surfaceT}, ${envLapse}, ${moist}  # C, C/km, C/km
envT = lambda z: surfaceT - envLapse*z
parcelT = lambda z: surfaceT - moist*z
cape = sum(max(parcelT(z) - envT(z), 0)*0.1 for z in np.arange(0, 12, 0.1)) * 100
print("CAPE (J/kg)", cape)`;

  return (
    <StudioChrome title="Atmospheric Stability (CAPE)" tagline="will storms fire?"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Surface temperature (°C)" value={surfaceT} min={10} max={40} step={1} onChange={(v) => update({ surfaceT: v })} />
        <Slider label="Environmental lapse (°C/km)" value={envLapse} min={4} max={10} step={0.1} onChange={(v) => update({ envLapse: v })} />
        <Slider label="Parcel lapse (°C/km)" value={moist} min={3} max={7} step={0.1} onChange={(v) => update({ moist: v })} />
        <p className="mt-3 text-xs text-slate-500">When a rising air parcel stays warmer than its surroundings, it keeps accelerating upward — the fuel for thunderstorms. The pink area between the parcel and environment curves is CAPE, the convective available potential energy. Large CAPE means tall, violent storms; a stable profile suppresses them. This is the core of severe-weather forecasting.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="CAPE (approx)" value={`${cape.toFixed(0)} J/kg`} />
        <Stat label="Forecast" value={verdict} />
        <Stat label="Lapse rate" value={`${envLapse.toFixed(1)} °C/km`} />
        <Equation tex={`\\mathrm{CAPE} = \\int_0^{z_t} g\\,\\frac{T_p - T_e}{T_e}\\,dz,\\quad T_p - T_e = (${envLapse.toFixed(1)} - ${moist.toFixed(1)})\\,z \\;\\Rightarrow\\; ${cape.toFixed(0)}\\ \\mathrm{J/kg}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={460} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
