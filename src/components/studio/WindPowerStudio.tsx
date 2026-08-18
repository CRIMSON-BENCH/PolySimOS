"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { diameter: number; windSpeed: number; cp: number }> = {
  "Light breeze": { diameter: 90, windSpeed: 5, cp: 0.42 },
  "Rated output": { diameter: 90, windSpeed: 12, cp: 0.45 },
  "Offshore giant": { diameter: 180, windSpeed: 12, cp: 0.48 },
  "Storm (cut-out)": { diameter: 90, windSpeed: 26, cp: 0.42 },
};

export function WindPowerStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ diameter, windSpeed, cp }, update] = useShareableNumbers({ diameter: 90, windSpeed: 10, cp: 0.42 });

  const rho = 1.225; const A = Math.PI * (diameter / 2) ** 2; const cutIn = 3, rated = 12, cutOut = 25;
  const power = (v: number) => { if (v < cutIn || v > cutOut) return 0; const p = 0.5 * rho * A * Math.pow(Math.min(v, rated), 3) * cp; return p; };
  const P = power(windSpeed); const ratedP = power(rated);

  useEffect(() => {
    const W = 500, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const vMax = 30;
    const X = (v: number) => ox + (v / vMax) * pw; const Y = (p: number) => oy - (p / (ratedP * 1.1)) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let v = 0; v <= vMax; v += 0.2) { const y = Y(power(v)); v === 0 ? ctx.moveTo(X(v), y) : ctx.lineTo(X(v), y); } ctx.stroke();
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(X(windSpeed), Y(P), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText("cut-in", X(cutIn) - 12, oy + 12); ctx.fillText("rated", X(rated) - 10, oy + 12); ctx.fillText("cut-out", X(cutOut) - 14, oy + 12); ctx.fillText("power vs wind speed", ox + 6, oy - ph + 12);
  }, [diameter, windSpeed, cp]);

  const betz = cp / 0.593;

  const explain =
    windSpeed < cutIn
      ? "Below the cut-in speed the rotor stays parked, so it captures no power at all."
      : windSpeed > cutOut
      ? "Above the cut-out speed the turbine shuts down to protect itself, so output drops to zero."
      : windSpeed >= rated
      ? "At or above rated wind speed the output is capped at rated power — the extra wind is spilled, not captured."
      : "In the ramp region power climbs with the cube of wind speed, so even a small gust adds a large jump in output.";

  const code = `import numpy as np
rho, Cp = 1.225, ${cp}
D, v = ${diameter}, ${windSpeed}
cut_in, rated, cut_out = 3, 12, 25
A = np.pi * (D / 2) ** 2
v_eff = min(v, rated) if cut_in <= v <= cut_out else 0
P = 0.5 * rho * A * v_eff ** 3 * Cp
print("power MW", P / 1e6)`;

  return (
    <StudioChrome title="Wind Turbine Power" tagline="the Betz limit"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Rotor diameter (m)" value={diameter} min={20} max={200} step={5} onChange={(v) => update({ diameter: v })} />
        <Slider label="Wind speed (m/s)" value={windSpeed} min={0} max={30} step={0.5} onChange={(v) => update({ windSpeed: v })} />
        <Slider label="Power coefficient Cp" value={cp} min={0.2} max={0.593} step={0.01} onChange={(v) => update({ cp: v })} />
        <p className="mt-3 text-xs text-slate-500">Wind power scales with the cube of wind speed and the square of rotor diameter — which is why turbines keep getting bigger and why a windy site is worth so much more. No turbine can extract more than 59.3% of the wind&apos;s energy (the Betz limit); real machines reach about 45%. Below cut-in and above cut-out speeds they produce nothing.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Power output" value={`${(P / 1e6).toFixed(2)} MW`} />
        <Stat label="Rated power" value={`${(ratedP / 1e6).toFixed(2)} MW`} />
        <Stat label="Swept area" value={`${A.toFixed(0)} m²`} />
        <Stat label="% of Betz limit" value={`${(betz * 100).toFixed(0)}%`} />
        <Equation tex={`P=\\tfrac12\\,\\rho A v^3 C_p=\\tfrac12(1.225)(${A.toFixed(0)})(${windSpeed})^3(${cp})=${(P / 1e6).toFixed(2)}\\,\\text{MW}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={500} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
