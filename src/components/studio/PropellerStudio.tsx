"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { power: number; diameter: number; airspeed: number }> = {
  "Cessna cruise": { power: 150, diameter: 1.9, airspeed: 60 },
  "Hover (static)": { power: 50, diameter: 2, airspeed: 0 },
  "Small drone": { power: 5, diameter: 0.5, airspeed: 10 },
  "Large slow rotor": { power: 100, diameter: 4, airspeed: 20 },
};

// Actuator-disk (momentum) theory for a propeller.
export function PropellerStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ power, diameter, airspeed }, update] = useShareableNumbers({ power: 50, diameter: 1.8, airspeed: 30 });

  const rho = 1.225; const A = Math.PI * (diameter / 2) ** 2; const P = power * 1000; const V = airspeed;
  // solve induced velocity: P = T(V+vi), T = 2 rho A (V+vi) vi  -> iterate
  let vi = 5; for (let k = 0; k < 40; k++) { const T = P / (V + vi); vi = T / (2 * rho * A * (V + vi)); }
  const T = P / (V + vi); const eff = V > 0 ? (T * V) / P : 0; const staticThrust = Math.cbrt(2 * rho * A * P * P);

  useEffect(() => {
    const W = 460, H = 260; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cy = H / 2; const dx = 200; const rpx = (diameter / 2) * 50;
    // streamtube contraction
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(40, cy - rpx * 1.4); ctx.quadraticCurveTo(dx, cy - rpx, W - 40, cy - rpx * 0.7); ctx.moveTo(40, cy + rpx * 1.4); ctx.quadraticCurveTo(dx, cy + rpx, W - 40, cy + rpx * 0.7); ctx.stroke();
    // disk
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(dx, cy - rpx); ctx.lineTo(dx, cy + rpx); ctx.stroke();
    // flow arrows
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("inflow V", 50, cy - rpx * 1.5); ctx.fillText("slipstream V+2vi", W - 130, cy - rpx * 0.9); ctx.fillText("actuator disk", dx - 30, cy + rpx + 18);
  }, [power, diameter, airspeed]);

  const explain =
    airspeed === 0
      ? `At a standstill, the disk delivers pure static thrust of about ${staticThrust.toFixed(0)} N — all the power goes into accelerating still air.`
      : eff < 0.5
      ? `Low forward speed relative to the induced flow keeps propulsive efficiency near ${(eff * 100).toFixed(0)}%; a larger disk would recover much of that loss.`
      : diameter >= 3
      ? `The large ${diameter.toFixed(1)} m disk moves a lot of air gently, so efficiency reaches ${(eff * 100).toFixed(0)}% for ${T.toFixed(0)} N of thrust.`
      : `At ${airspeed.toFixed(0)} m/s the prop produces ${T.toFixed(0)} N at ${(eff * 100).toFixed(0)}% efficiency; wasted energy shows up as the ${vi.toFixed(1)} m/s slipstream.`;

  const code = `import numpy as np
power_kW, diameter, airspeed = ${power}, ${diameter}, ${airspeed}
rho = 1.225
A = np.pi * (diameter / 2) ** 2
P, V = power_kW * 1000, airspeed
vi = 5.0
for _ in range(40):
    T = P / (V + vi)
    vi = T / (2 * rho * A * (V + vi))
T = P / (V + vi)
eff = (T * V) / P if V > 0 else 0.0
static = (2 * rho * A * P ** 2) ** (1 / 3)
print("thrust", round(T), "eff", round(eff, 3), "static", round(static))`;

  return (
    <StudioChrome title="Propeller Thrust" tagline="actuator-disk theory"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Power (kW)" value={power} min={5} max={300} step={5} onChange={(v) => update({ power: v })} />
        <Slider label="Diameter (m)" value={diameter} min={0.5} max={4} step={0.1} onChange={(v) => update({ diameter: v })} />
        <Slider label="Airspeed (m/s)" value={airspeed} min={0} max={100} step={2} onChange={(v) => update({ airspeed: v })} />
        <p className="mt-3 text-xs text-slate-500">Momentum theory treats a propeller as a disk that accelerates the air passing through it, and the reaction is thrust. For a given power, a bigger disk moves more air more gently — producing more thrust at higher efficiency. That is why efficient props and helicopter rotors are large and slow, while jets accept lower efficiency for compactness and speed.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Thrust" value={`${T.toFixed(0)} N`} /><Stat label="Static thrust" value={`${staticThrust.toFixed(0)} N`} /><Stat label="Induced velocity" value={`${vi.toFixed(1)} m/s`} /><Stat label="Propulsive eff." value={`${(eff * 100).toFixed(0)}%`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={460} height={260} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
