"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function WindPowerStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [diameter, setDiameter] = useState(90); // m
  const [windSpeed, setWindSpeed] = useState(10); // m/s
  const [cp, setCp] = useState(0.42);

  const rho = 1.225; const A = Math.PI * (diameter / 2) ** 2; const cutIn = 3, rated = 12, cutOut = 25;
  const power = (v: number) => { if (v < cutIn || v > cutOut) return 0; const p = 0.5 * rho * A * Math.pow(Math.min(v, rated), 3) * cp; return p; };
  const P = power(windSpeed); const ratedP = power(rated);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 500, H = 300; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const vMax = 30;
    const X = (v: number) => ox + (v / vMax) * pw; const Y = (p: number) => oy - (p / (ratedP * 1.1)) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let v = 0; v <= vMax; v += 0.2) { const y = Y(power(v)); v === 0 ? ctx.moveTo(X(v), y) : ctx.lineTo(X(v), y); } ctx.stroke();
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(X(windSpeed), Y(P), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText("cut-in", X(cutIn) - 12, oy + 12); ctx.fillText("rated", X(rated) - 10, oy + 12); ctx.fillText("cut-out", X(cutOut) - 14, oy + 12); ctx.fillText("power vs wind speed", ox + 6, oy - ph + 12);
  }, [diameter, windSpeed, cp]);

  const betz = cp / 0.593;
  return (
    <StudioChrome title="Wind Turbine Power" tagline="the Betz limit"
      controls={<div>
        <Slider label="Rotor diameter (m)" value={diameter} min={20} max={200} step={5} onChange={setDiameter} />
        <Slider label="Wind speed (m/s)" value={windSpeed} min={0} max={30} step={0.5} onChange={setWindSpeed} />
        <Slider label="Power coefficient Cp" value={cp} min={0.2} max={0.593} step={0.01} onChange={setCp} />
        <p className="mt-3 text-xs text-slate-500">Wind power scales with the cube of wind speed and the square of rotor diameter — which is why turbines keep getting bigger and why a windy site is worth so much more. No turbine can extract more than 59.3% of the wind&apos;s energy (the Betz limit); real machines reach about 45%. Below cut-in and above cut-out speeds they produce nothing.</p>
      </div>}
      inspector={<div><Stat label="Power output" value={`${(P / 1e6).toFixed(2)} MW`} /><Stat label="Rated power" value={`${(ratedP / 1e6).toFixed(2)} MW`} /><Stat label="Swept area" value={`${A.toFixed(0)} m²`} /><Stat label="% of Betz limit" value={`${(betz * 100).toFixed(0)}%`} /></div>}
    ><canvas ref={canvasRef} width={500} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
