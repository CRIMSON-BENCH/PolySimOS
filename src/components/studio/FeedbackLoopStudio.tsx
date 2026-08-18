"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { gain: number; plantDrift: number; disturbance: number }> = {
  "Thermostat": { gain: 150, plantDrift: 40, disturbance: 30 },
  "Cruise control": { gain: 100, plantDrift: 20, disturbance: 25 },
  "Low gain (sloppy)": { gain: 5, plantDrift: 45, disturbance: 45 },
  "Op-amp (huge gain)": { gain: 200, plantDrift: 55, disturbance: 55 },
};

export function FeedbackLoopStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ gain, plantDrift, disturbance }, update] = useShareableNumbers({ gain: 50, plantDrift: 30, disturbance: 20 });
  const G = gain; const closedGain = G / (1 + G);
  const openError = plantDrift; const closedError = plantDrift / (1 + G);
  const openDist = disturbance; const closedDist = disturbance / (1 + G);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // block diagram
    ctx.strokeStyle = "#475569"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(90, 110, 16, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = "#e2e8f0"; ctx.font = "14px sans-serif"; ctx.fillText("+", 84, 115); ctx.fillText("−", 84, 140);
    ctx.strokeStyle = "#22d3ee"; ctx.strokeRect(180, 88, 120, 44); ctx.fillStyle = "#94a3b8"; ctx.font = "12px sans-serif"; ctx.fillText(`plant × G=${G}`, 195, 114);
    ctx.strokeStyle = "#475569"; ctx.beginPath(); ctx.moveTo(20, 110); ctx.lineTo(74, 110); ctx.moveTo(106, 110); ctx.lineTo(180, 110); ctx.moveTo(300, 110); ctx.lineTo(420, 110); ctx.stroke();
    // feedback line
    ctx.strokeStyle = "#f472b6"; ctx.beginPath(); ctx.moveTo(360, 110); ctx.lineTo(360, 200); ctx.lineTo(90, 200); ctx.lineTo(90, 126); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("output", 380, 104); ctx.fillText("feedback compares output to setpoint", 90, 230);
    // error bars
    ctx.fillStyle = "#64748b"; ctx.fillRect(90, 270, openError * 3, 14); ctx.fillStyle = "#22d3ee"; ctx.fillRect(90, 290, closedError * 3, 14);
    ctx.fillStyle = "#e2e8f0"; ctx.fillText(`open-loop error ${openError.toFixed(0)}%`, 100 + openError * 3, 281); ctx.fillText(`closed-loop error ${closedError.toFixed(1)}%`, 100 + closedError * 3, 301);
  }, [gain, plantDrift, disturbance, G, openError, closedError]);

  const explain =
    G >= 100
      ? `Very high loop gain: error and disturbances both shrink by 1+G ≈ ${(1 + G).toFixed(0)}×, so the output tracks the setpoint almost perfectly — this is why op-amps and precision controllers run enormous gain.`
      : G >= 20
      ? `Moderate gain divides both tracking error and disturbance by 1+G = ${(1 + G).toFixed(0)}×, cutting the ${openError.toFixed(0)}% open-loop error down to ${closedError.toFixed(1)}%.`
      : `Low gain means weak correction: dividing by just 1+G = ${(1 + G).toFixed(0)}× leaves a large ${closedError.toFixed(1)}% residual error. Raise the gain to tighten tracking.`;

  const code = `G, plant_drift, disturbance = ${gain}, ${plantDrift}, ${disturbance}
closed_gain = G / (1 + G)
closed_error = plant_drift / (1 + G)
closed_dist = disturbance / (1 + G)
print("closed-loop gain", round(closed_gain, 3))
print("error", round(closed_error, 2), "%  (was", plant_drift, "%)")
print("disturbance rejected", round(100 - closed_dist / disturbance * 100), "%")`;

  return (
    <StudioChrome title="Feedback Loop" tagline="why feedback beats open-loop"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Loop gain G" value={gain} min={1} max={200} step={1} onChange={(v) => update({ gain: v })} />
        <Slider label="Plant drift (%)" value={plantDrift} min={0} max={60} step={1} onChange={(v) => update({ plantDrift: v })} />
        <Slider label="Disturbance (%)" value={disturbance} min={0} max={60} step={1} onChange={(v) => update({ disturbance: v })} />
        <p className="mt-3 text-xs text-slate-500">Feedback measures the output, compares it to the target, and corrects the difference. High loop gain shrinks both tracking error and the effect of disturbances by a factor of 1+G — which is why feedback control is everywhere, from thermostats to cruise control. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Closed-loop gain" value={closedGain.toFixed(3)} />
        <Stat label="Error reduction" value={`${(1 + G).toFixed(0)}×`} />
        <Stat label="Disturbance rejected" value={`${(100 - closedDist / openDist * 100).toFixed(0)}%`} />
        <Equation tex={`T = \\dfrac{G}{1+GH} = \\dfrac{${G.toFixed(0)}}{1+${G.toFixed(0)}\\cdot 1} = ${closedGain.toFixed(3)}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
