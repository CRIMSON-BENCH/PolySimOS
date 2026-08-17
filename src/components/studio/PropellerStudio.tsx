"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Actuator-disk (momentum) theory for a propeller.
export function PropellerStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [power, setPower] = useState(50); // kW
  const [diameter, setDiameter] = useState(1.8); // m
  const [airspeed, setAirspeed] = useState(30); // m/s

  const rho = 1.225; const A = Math.PI * (diameter / 2) ** 2; const P = power * 1000; const V = airspeed;
  // solve induced velocity: P = T(V+vi), T = 2 rho A (V+vi) vi  -> iterate
  let vi = 5; for (let k = 0; k < 40; k++) { const T = P / (V + vi); vi = T / (2 * rho * A * (V + vi)); }
  const T = P / (V + vi); const eff = V > 0 ? (T * V) / P : 0; const staticThrust = Math.cbrt(2 * rho * A * P * P);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 460, H = 260; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cy = H / 2; const dx = 200; const rpx = (diameter / 2) * 50;
    // streamtube contraction
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(40, cy - rpx * 1.4); ctx.quadraticCurveTo(dx, cy - rpx, W - 40, cy - rpx * 0.7); ctx.moveTo(40, cy + rpx * 1.4); ctx.quadraticCurveTo(dx, cy + rpx, W - 40, cy + rpx * 0.7); ctx.stroke();
    // disk
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(dx, cy - rpx); ctx.lineTo(dx, cy + rpx); ctx.stroke();
    // flow arrows
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("inflow V", 50, cy - rpx * 1.5); ctx.fillText("slipstream V+2vi", W - 130, cy - rpx * 0.9); ctx.fillText("actuator disk", dx - 30, cy + rpx + 18);
  }, [power, diameter, airspeed]);

  return (
    <StudioChrome title="Propeller Thrust" tagline="actuator-disk theory"
      controls={<div>
        <Slider label="Power (kW)" value={power} min={5} max={300} step={5} onChange={setPower} />
        <Slider label="Diameter (m)" value={diameter} min={0.5} max={4} step={0.1} onChange={setDiameter} />
        <Slider label="Airspeed (m/s)" value={airspeed} min={0} max={100} step={2} onChange={setAirspeed} />
        <p className="mt-3 text-xs text-slate-500">Momentum theory treats a propeller as a disk that accelerates the air passing through it, and the reaction is thrust. For a given power, a bigger disk moves more air more gently — producing more thrust at higher efficiency. That is why efficient props and helicopter rotors are large and slow, while jets accept lower efficiency for compactness and speed.</p>
      </div>}
      inspector={<div><Stat label="Thrust" value={`${T.toFixed(0)} N`} /><Stat label="Static thrust" value={`${staticThrust.toFixed(0)} N`} /><Stat label="Induced velocity" value={`${vi.toFixed(1)} m/s`} /><Stat label="Propulsive eff." value={`${(eff * 100).toFixed(0)}%`} /></div>}
    ><canvas ref={canvasRef} width={460} height={260} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
