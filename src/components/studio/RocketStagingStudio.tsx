"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { stages: number; massRatio: number; isp: number }> = {
  "Single stage": { stages: 1, massRatio: 6, isp: 350 },
  "Two-stage LEO": { stages: 2, massRatio: 4, isp: 350 },
  "Three-stage GTO": { stages: 3, massRatio: 4, isp: 380 },
  "Heavy lifter": { stages: 2, massRatio: 8, isp: 300 },
};

// Multi-stage rocket delta-v (Tsiolkovsky per stage).
export function RocketStagingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ stages, massRatio, isp }, update] = useShareableNumbers({ stages: 2, massRatio: 4, isp: 350 });

  const ve = isp * 9.81; const perStage = ve * Math.log(massRatio); const total = perStage * Math.round(stages);
  const orbitDV = 9400; // approx LEO

  useEffect(() => {
    const W = 300, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2; const n = Math.round(stages); let y = H - 40;
    const cols = ["#22d3ee", "#a3e635", "#f472b6", "#fbbf24"];
    for (let i = 0; i < n; i++) { const w = 60 - i * 8, h = 60; ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(cx - w / 2, y - h, w, h); ctx.strokeStyle = "#0b1220"; ctx.strokeRect(cx - w / 2, y - h, w, h); ctx.fillStyle = "#0b1220"; ctx.font = "10px sans-serif"; ctx.fillText(`stage ${i + 1}`, cx - 20, y - h / 2); y -= h + 4; }
    // nose
    ctx.fillStyle = "#e2e8f0"; ctx.beginPath(); ctx.moveTo(cx, y - 30); ctx.lineTo(cx - 16, y); ctx.lineTo(cx + 16, y); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("payload", cx - 20, y - 8);
  }, [stages, massRatio, isp]);

  const explain = total >= orbitDV
    ? `${Math.round(stages)} stages at Isp ${isp}s and mass ratio ${massRatio} each sum to ${(total / 1000).toFixed(1)} km/s — past the ~9.4 km/s LEO budget, since every stage adds ve·ln(ratio) after dropping dead weight.`
    : `Only ${(total / 1000).toFixed(1)} km/s, ${((orbitDV - total) / 1000).toFixed(1)} km/s short of LEO. Add a stage or raise the mass ratio: Δv grows just with ln(ratio), so shedding tankage matters more than raw propellant.`;

  const code = `import math
stages, mass_ratio, isp = ${Math.round(stages)}, ${massRatio}, ${isp}
ve = isp * 9.81
per_stage = ve * math.log(mass_ratio)
total = per_stage * stages
print("dv per stage", round(per_stage), "m/s; total", round(total), "m/s")
print("reaches LEO" if total >= 9400 else "short of LEO")`;

  return (
    <StudioChrome title="Rocket Staging" tagline="beating the tyranny of the equation"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Number of stages" value={stages} min={1} max={4} step={1} onChange={(v) => update({ stages: v })} />
        <Slider label="Mass ratio per stage" value={massRatio} min={2} max={8} step={0.2} onChange={(v) => update({ massRatio: v })} />
        <Slider label="Specific impulse Isp (s)" value={isp} min={250} max={450} step={10} onChange={(v) => update({ isp: v })} />
        <p className="mt-3 text-xs text-slate-500">The rocket equation grows delta-v only with the logarithm of the mass ratio, so a single stage hauling empty tanks all the way up is hopelessly inefficient. Staging drops dead weight along the way: each stage contributes ve·ln(mass ratio), and their sum easily clears the ~9.4 km/s needed for low Earth orbit.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Δv per stage" value={`${(perStage / 1000).toFixed(2)} km/s`} /><Stat label="Total Δv" value={`${(total / 1000).toFixed(2)} km/s`} /><Stat label="Reaches LEO?" value={total >= orbitDV ? "yes" : "no"} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={300} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
