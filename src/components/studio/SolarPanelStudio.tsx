"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { area: number; eff: number; peakSun: number; tilt: number }> = {
  "Rooftop home": { area: 20, eff: 20, peakSun: 5, tilt: 30 },
  "Desert farm": { area: 100, eff: 22, peakSun: 7, tilt: 25 },
  "Cloudy north": { area: 40, eff: 18, peakSun: 3, tilt: 45 },
  "Premium panels": { area: 30, eff: 26, peakSun: 5.5, tilt: 35 },
};

export function SolarPanelStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ area, eff, peakSun, tilt }, update] = useShareableNumbers({ area: 20, eff: 20, peakSun: 5, tilt: 30 });

  const rating = area * 1000 * eff / 100; // W at 1000 W/m^2 (STP)
  const tiltFactor = 1 - Math.abs(tilt - 35) / 120;
  const daily = rating / 1000 * peakSun * tiltFactor; // kWh/day
  const annual = daily * 365;

  useEffect(() => {
    const W = 500, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 35, pw = W - 60, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // power over a day (bell)
    ctx.fillStyle = "rgba(251,191,36,0.2)"; ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= pw; i++) { const h = (i / pw) * 24; const p = Math.max(0, Math.sin((h - 6) / 12 * Math.PI)) * rating * tiltFactor; const y = oy - (p / (rating * 1.1)) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("power output over a day (W)", ox + 6, oy - ph + 12); ctx.fillText("6am", ox + pw / 4 - 8, oy + 14); ctx.fillText("noon", ox + pw / 2 - 10, oy + 14); ctx.fillText("6pm", ox + 3 * pw / 4 - 8, oy + 14);
  }, [area, eff, peakSun, tilt]);

  const explain =
    tiltFactor < 0.8
      ? `A tilt of ${tilt}° is far from the ~35° sweet spot, shaving output down to ${(tiltFactor * 100).toFixed(0)}% of ideal — re-aiming the panels is the cheapest gain here.`
      : peakSun < 3.5
      ? `With only ${peakSun} peak sun hours, sunlight — not panel size — is the binding constraint; more area helps but each kW earns less.`
      : eff >= 24
      ? `High-efficiency panels (${eff}%) pack more watts into ${area} m², so this array delivers ${(rating / 1000).toFixed(1)} kW from a compact footprint.`
      : `A ${(rating / 1000).toFixed(1)} kW array in ${peakSun}-sun-hour sun yields about ${daily.toFixed(1)} kWh/day — roughly ${(annual / 10000).toFixed(1)} average homes.`;

  const pyCode = `area, eff, peak_sun, tilt = ${area}, ${eff}, ${peakSun}, ${tilt}
rating = area * 1000 * eff / 100          # W at 1000 W/m^2
tilt_factor = 1 - abs(tilt - 35) / 120
daily = rating / 1000 * peak_sun * tilt_factor  # kWh/day
annual = daily * 365
print("rating kW", rating / 1000, "daily kWh", daily, "annual kWh", annual)`;

  return (
    <StudioChrome title="Solar PV System" tagline="panels to kilowatt-hours"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Panel area (m²)" value={area} min={2} max={100} step={1} onChange={(v) => update({ area: v })} />
        <Slider label="Panel efficiency (%)" value={eff} min={10} max={26} step={0.5} onChange={(v) => update({ eff: v })} />
        <Slider label="Peak sun hours/day" value={peakSun} min={2} max={7} step={0.1} onChange={(v) => update({ peakSun: v })} />
        <Slider label="Tilt angle (°)" value={tilt} min={0} max={90} step={5} onChange={(v) => update({ tilt: v })} />
        <p className="mt-3 text-xs text-slate-500">A solar array&apos;s output is its rated power (area × efficiency at 1000 W/m²) multiplied by the peak sun hours your location receives — the equivalent full-intensity hours per day. Tilt matters too: aiming the panels near your latitude maximizes annual yield. Real systems lose a bit more to heat, wiring, and inverters.</p>
        <ShareBar code={pyCode} />
      </div>}
      inspector={<div><Stat label="System rating" value={`${(rating / 1000).toFixed(1)} kW`} /><Stat label="Daily energy" value={`${daily.toFixed(1)} kWh`} /><Stat label="Annual energy" value={`${annual.toFixed(0)} kWh`} /><Stat label="Homes powered" value={(annual / 10000).toFixed(1)} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
