"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function EVEfficiencyStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [battery, setBattery] = useState(60); // kWh
  const [speed, setSpeed] = useState(100); // km/h
  const [mass, setMass] = useState(1800); // kg

  const cd = 0.28, A = 2.3, rho = 1.225, crr = 0.01, g = 9.81, drivetrain = 0.88;
  const consumption = (v: number) => { const vm = v / 3.6; const drag = 0.5 * rho * cd * A * vm * vm; const roll = crr * mass * g; const force = drag + roll; const Wperkm = force / drivetrain; return Wperkm / 1000; }; // kWh/km
  const cons = consumption(speed); const range = battery / cons;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 500, H = 300; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const vMax = 160;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let v = 20; v <= vMax; v += 2) { const r = battery / consumption(v); const x = ox + (v / vMax) * pw; const y = oy - (r / (battery / consumption(20) * 1.05)) * ph; v === 20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    const px = ox + (speed / vMax) * pw; const py = oy - (range / (battery / consumption(20) * 1.05)) * ph; ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("range vs cruising speed (km)", ox + 6, oy - ph + 12); ctx.fillText("speed km/h →", ox + pw - 80, oy + 16);
  }, [battery, speed, mass]);

  return (
    <StudioChrome title="EV Range & Efficiency" tagline="why speed kills range"
      controls={<div>
        <Slider label="Battery (kWh)" value={battery} min={20} max={120} step={5} onChange={setBattery} />
        <Slider label="Cruising speed (km/h)" value={speed} min={30} max={160} step={5} onChange={setSpeed} />
        <Slider label="Vehicle mass (kg)" value={mass} min={1000} max={3000} step={50} onChange={setMass} />
        <p className="mt-3 text-xs text-slate-500">An electric car&apos;s range is its battery divided by its energy use per kilometer. At low speed rolling resistance dominates; at highway speed aerodynamic drag — which grows with the square of speed — takes over, so consumption climbs steeply. That is why an EV goes much farther in the city than on the motorway, the opposite of a gasoline car.</p>
      </div>}
      inspector={<div><Stat label="Consumption" value={`${(cons * 100).toFixed(1)} kWh/100km`} /><Stat label="Range" value={`${range.toFixed(0)} km`} /><Stat label="Efficiency" value={`${(1 / cons).toFixed(1)} km/kWh`} /></div>}
    ><canvas ref={canvasRef} width={500} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
