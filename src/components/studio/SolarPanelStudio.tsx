"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function SolarPanelStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [area, setArea] = useState(20); // m^2
  const [eff, setEff] = useState(20); // %
  const [peakSun, setPeakSun] = useState(5); // peak sun hours
  const [tilt, setTilt] = useState(30);

  const rating = area * 1000 * eff / 100; // W at 1000 W/m^2 (STP)
  const tiltFactor = 1 - Math.abs(tilt - 35) / 120;
  const daily = rating / 1000 * peakSun * tiltFactor; // kWh/day
  const annual = daily * 365;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 500, H = 300; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 35, pw = W - 60, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // power over a day (bell)
    ctx.fillStyle = "rgba(251,191,36,0.2)"; ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= pw; i++) { const h = (i / pw) * 24; const p = Math.max(0, Math.sin((h - 6) / 12 * Math.PI)) * rating * tiltFactor; const y = oy - (p / (rating * 1.1)) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("power output over a day (W)", ox + 6, oy - ph + 12); ctx.fillText("6am", ox + pw / 4 - 8, oy + 14); ctx.fillText("noon", ox + pw / 2 - 10, oy + 14); ctx.fillText("6pm", ox + 3 * pw / 4 - 8, oy + 14);
  }, [area, eff, peakSun, tilt]);

  return (
    <StudioChrome title="Solar PV System" tagline="panels to kilowatt-hours"
      controls={<div>
        <Slider label="Panel area (m²)" value={area} min={2} max={100} step={1} onChange={setArea} />
        <Slider label="Panel efficiency (%)" value={eff} min={10} max={26} step={0.5} onChange={setEff} />
        <Slider label="Peak sun hours/day" value={peakSun} min={2} max={7} step={0.1} onChange={setPeakSun} />
        <Slider label="Tilt angle (°)" value={tilt} min={0} max={90} step={5} onChange={setTilt} />
        <p className="mt-3 text-xs text-slate-500">A solar array&apos;s output is its rated power (area × efficiency at 1000 W/m²) multiplied by the peak sun hours your location receives — the equivalent full-intensity hours per day. Tilt matters too: aiming the panels near your latitude maximizes annual yield. Real systems lose a bit more to heat, wiring, and inverters.</p>
      </div>}
      inspector={<div><Stat label="System rating" value={`${(rating / 1000).toFixed(1)} kW`} /><Stat label="Daily energy" value={`${daily.toFixed(1)} kWh`} /><Stat label="Annual energy" value={`${annual.toFixed(0)} kWh`} /><Stat label="Homes powered" value={(annual / 10000).toFixed(1)} /></div>}
    ><canvas ref={canvasRef} width={500} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
