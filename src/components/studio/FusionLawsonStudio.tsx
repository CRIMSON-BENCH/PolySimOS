"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { density: number; tau: number; temp: number }> = {
  "Sub-ignition": { density: 1, tau: 1, temp: 15 },
  "Break-even": { density: 2, tau: 1, temp: 15 },
  "Tokamak (ITER)": { density: 1.5, tau: 2, temp: 20 },
  "Inertial (laser)": { density: 9, tau: 0.2, temp: 30 },
};

// Lawson criterion / triple product for fusion ignition.
export function FusionLawsonStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ density, tau, temp }, update] = useShareableNumbers({ density: 1, tau: 1, temp: 15 });

  const n = density * 1e20; const triple = n * tau * temp; // n T tau in 10^21 keV s/m^3-ish
  const ignition = 3e21; // approx D-T triple product threshold
  const ratio = triple / ignition; const ignited = ratio >= 1;

  useEffect(() => {
    const W = 500, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const tMax = 60;
    const X = (t: number) => ox + (t / tMax) * pw; const Y = (nt: number) => oy - (Math.log10(nt) - 19) / 3 * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // ignition curve (n*tau needed vs T, U-shaped min around 25 keV)
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2; ctx.beginPath(); for (let t = 4; t <= tMax; t += 1) { const need = ignition / t * (1 + Math.pow((t - 25) / 25, 2) * 0.8); const y = Y(need / t * t); const nt = need; const yy = oy - (Math.log10(nt) - 20) / 2 * ph; t === 4 ? ctx.moveTo(X(t), yy) : ctx.lineTo(X(t), yy); void y; } ctx.stroke();
    // operating point
    const opNT = n * tau; const opy = oy - (Math.log10(opNT) - 20) / 2 * ph;
    ctx.fillStyle = ignited ? "#a3e635" : "#f472b6"; ctx.beginPath(); ctx.arc(X(temp), Math.max(10, Math.min(oy, opy)), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("ignition boundary (green) — nτ vs temperature", ox + 6, oy - ph + 12); ctx.fillText("temperature (keV) →", ox + pw - 130, oy + 16);
  }, [density, tau, temp, ignited]);

  const explain = ignited
    ? `Above threshold — the triple product ${triple.toExponential(1)} clears the Lawson minimum, so fusion self-heating can sustain the burn without external power.`
    : temp < 12 || temp > 40
    ? "Off the ~25 keV sweet spot where D-T reactivity peaks — nudging temperature toward 25 keV cuts the density and confinement you need to ignite."
    : `Sub-ignition at ${(ratio * 100).toFixed(0)}% — the plasma leaks heat faster than fusion replaces it, so raise density, confinement time, or temperature to close the gap.`;

  const code = `n0, tau, T = ${density}e20, ${tau}, ${temp}  # /m^3, s, keV
triple = n0 * tau * T
ignition = 3e21  # approx D-T threshold
print("triple", triple, "fraction of ignition", triple / ignition)`;

  return (
    <StudioChrome title="Fusion (Lawson Criterion)" tagline="the recipe for a star on Earth"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Density (10²⁰ /m³)" value={density} min={0.1} max={10} step={0.1} onChange={(v) => update({ density: v })} />
        <Slider label="Confinement time (s)" value={tau} min={0.1} max={5} step={0.1} onChange={(v) => update({ tau: v })} />
        <Slider label="Temperature (keV)" value={temp} min={5} max={50} step={1} onChange={(v) => update({ temp: v })} />
        <p className="mt-3 text-xs text-slate-500">To get more fusion energy out than you put in, a plasma must be hot enough, dense enough, and confined long enough — captured together in the triple product n·τ·T. The Lawson criterion sets the threshold for ignition, where the fusion self-heats. Crossing it, at over 100 million degrees, is the decades-long goal of tokamaks and laser fusion.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Triple product" value={`${triple.toExponential(2)}`} /><Stat label="Fraction of ignition" value={`${(ratio * 100).toFixed(0)}%`} /><Stat label="Status" value={ignited ? "IGNITION" : "sub-ignition"} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
