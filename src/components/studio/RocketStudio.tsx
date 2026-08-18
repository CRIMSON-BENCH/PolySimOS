"use client";

import { useMemo } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { m0: number; mf: number; isp: number }> = {
  "Kerolox booster": { m0: 500, mf: 100, isp: 300 },
  "Hydrolox stage": { m0: 400, mf: 80, isp: 450 },
  "Heavy first stage": { m0: 900, mf: 200, isp: 310 },
  "Efficient upper": { m0: 200, mf: 40, isp: 460 },
};

export function RocketStudio() {
  const [{ m0, mf, isp }, update] = useShareableNumbers({ m0: 500, mf: 100, isp: 350 });

  const dv = useMemo(() => 9.80665 * isp * Math.log(m0 / mf), [m0, mf, isp]);
  const massRatio = m0 / mf;
  const propellant = m0 - mf;
  const targets = [
    ["LEO (Earth orbit)", 9400], ["Moon transfer", 12500], ["Mars transfer", 13100], ["Escape Earth", 11200],
  ];

  const explain =
    dv >= 13100
      ? `A Δv of ${dv.toFixed(0)} m/s clears a Mars transfer — this stage could push a payload interplanetary.`
      : dv >= 9400
      ? `A Δv of ${dv.toFixed(0)} m/s reaches low Earth orbit but falls short of a lunar transfer; raise the mass ratio or Isp for more.`
      : massRatio < 3
      ? `The mass ratio of ${massRatio.toFixed(2)} is low — too little of the vehicle is propellant, so Δv stays modest despite the engine.`
      : `At ${dv.toFixed(0)} m/s this stage cannot reach orbit; since Δv grows only with the log of mass ratio, big gains need a much emptier tank or higher Isp.`;

  const code = `import numpy as np
m0, mf, isp = ${m0}, ${mf}, ${isp}
dv = 9.80665 * isp * np.log(m0 / mf)
print("delta-v", round(dv), "m/s", "| mass ratio", round(m0 / mf, 2))`;

  return (
    <StudioChrome title="Rocket Equation (Tsiolkovsky)" tagline="Δv = g·Isp·ln(m₀/m_f)"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">The equation that rules spaceflight. Your Δv budget depends only on exhaust velocity and the ratio of full-to-empty mass — and it&apos;s brutally logarithmic.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Wet mass m₀ (t)" value={m0} min={110} max={1000} step={10} onChange={(v) => update({ m0: v })} />
        <Slider label="Dry mass m_f (t)" value={mf} min={20} max={400} step={5} onChange={(v) => update({ mf: v })} />
        <Slider label="Specific impulse Isp (s)" value={isp} min={200} max={460} step={5} onChange={(v) => update({ isp: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Δv" value={`${dv.toFixed(0)} m/s`} /><Stat label="Mass ratio" value={massRatio.toFixed(2)} /><Stat label="Propellant" value={`${propellant} t`} /><Stat label="Exhaust vel." value={`${(9.80665 * isp).toFixed(0)} m/s`} /><ExplainResult text={explain} /></div>}
    >
      <div className="p-4">
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6 text-center dark:border-cyan-900 dark:bg-cyan-950/40">
          <p className="text-sm text-slate-600 dark:text-slate-400">Delta-v budget</p>
          <p className="mt-1 text-5xl font-black text-cyan-700 dark:text-cyan-300">{dv.toFixed(0)}<span className="text-2xl"> m/s</span></p>
        </div>
        <div className="mt-5 space-y-2">
          {targets.map(([name, need]) => (
            <div key={name as string} className="flex items-center gap-3">
              <span className="w-44 text-sm text-slate-600 dark:text-slate-400">{name}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (dv / (need as number)) * 100)}%`, background: dv >= (need as number) ? "#84cc16" : "#f59e0b" }} />
              </div>
              <span className={`w-16 text-right text-xs font-semibold ${dv >= (need as number) ? "text-lime-600 dark:text-lime-400" : "text-amber-600 dark:text-amber-400"}`}>{dv >= (need as number) ? "reach ✓" : `${Math.round((dv / (need as number)) * 100)}%`}</span>
            </div>
          ))}
        </div>
      </div>
    </StudioChrome>
  );
}
