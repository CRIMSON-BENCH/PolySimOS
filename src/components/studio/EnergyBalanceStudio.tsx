"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { useShareableNumbers } from "@/lib/studioKit";

const SIGMA = 5.670374e-8;

const PRESETS: Record<string, { solar: number; albedo: number; emissivity: number }> = {
  "Earth today": { solar: 1361, albedo: 0.3, emissivity: 0.62 },
  "Snowball Earth": { solar: 1361, albedo: 0.6, emissivity: 0.62 },
  "Runaway greenhouse": { solar: 1900, albedo: 0.2, emissivity: 0.35 },
  "Airless rock": { solar: 1361, albedo: 0.3, emissivity: 1 },
};

export function EnergyBalanceStudio() {
  const [{ solar, albedo, emissivity }, update] = useShareableNumbers({ solar: 1361, albedo: 0.3, emissivity: 0.62 });

  const absorbed = solar * (1 - albedo) / 4; // averaged over sphere
  const Tnoatm = Math.pow(solar * (1 - albedo) / (4 * SIGMA), 0.25); // no greenhouse
  const Tsurf = Math.pow(absorbed / (emissivity * SIGMA), 0.25);
  const greenhouseC = Tsurf - Tnoatm;
  const tC = Tsurf - 273.15;

  const color = tC < -10 ? "#93c5fd" : tC < 5 ? "#67e8f9" : tC < 20 ? "#a3e635" : tC < 35 ? "#fbbf24" : "#f97316";

  const explain =
    emissivity > 0.95
      ? `With emissivity near 1 there is almost no greenhouse effect, so the surface sits close to its bare-rock temperature of ${(Tnoatm - 273.15).toFixed(0)} °C.`
      : greenhouseC > 60
      ? `A very low emissivity traps outgoing infrared so strongly the surface runs ${greenhouseC.toFixed(0)} °C hotter than a bare rock — a runaway greenhouse.`
      : albedo > 0.5
      ? `High albedo reflects most sunlight straight back, so even with greenhouse warming the planet stays cold at ${tC.toFixed(0)} °C.`
      : `Dropping emissivity below 1 mimics greenhouse gases: they add ${greenhouseC.toFixed(0)} °C on top of the ${(Tnoatm - 273.15).toFixed(0)} °C bare-rock temperature.`;

  const code = `import numpy as np
SIGMA = 5.670374e-8
solar, albedo, emissivity = ${solar}, ${albedo}, ${emissivity}
absorbed = solar*(1-albedo)/4
T_noatm = (solar*(1-albedo)/(4*SIGMA))**0.25
T_surf = (absorbed/(emissivity*SIGMA))**0.25
print("surface C", T_surf-273.15, "greenhouse C", T_surf-T_noatm)`;

  return (
    <StudioChrome title="Planetary Energy Balance" tagline="greenhouse effect · equilibrium temperature"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Solar constant (W/m²)" value={solar} min={800} max={2000} step={10} onChange={(v) => update({ solar: v })} />
        <Slider label="Albedo (reflectivity)" value={albedo} min={0} max={0.8} step={0.01} onChange={(v) => update({ albedo: v })} />
        <Slider label="Effective emissivity" value={emissivity} min={0.3} max={1} step={0.01} onChange={(v) => update({ emissivity: v })} />
        <p className="mt-3 text-xs text-slate-500">A planet warms until it radiates away exactly the sunlight it absorbs. Balancing absorbed power S(1−α)/4 against εσT⁴ gives the equilibrium temperature. An emissivity below 1 represents greenhouse gases trapping outgoing infrared, raising the surface temperature.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Absorbed power" value={`${absorbed.toFixed(0)} W/m²`} /><Stat label="No-greenhouse T" value={`${(Tnoatm - 273.15).toFixed(1)} °C`} /><Stat label="Greenhouse warming" value={`+${greenhouseC.toFixed(1)} °C`} /><Equation tex={`\\frac{(1-${albedo})\\,${solar}}{4} = ${emissivity}\\,\\sigma T^4 \\;\\Rightarrow\\; T_{eq} = ${Tsurf.toFixed(1)}\\ \\text{K}`} /><ExplainResult text={explain} /></div>}
    ><div className="flex flex-col items-center justify-center py-16">
        <div className="text-xs uppercase tracking-widest text-slate-500">Equilibrium surface temperature</div>
        <div className="mt-3 text-7xl font-black" style={{ color }}>{tC.toFixed(1)}<span className="ml-2 text-3xl text-slate-400">°C</span></div>
        <div className="mt-2 text-sm text-slate-500">{Tsurf.toFixed(1)} K</div>
      </div></StudioChrome>
  );
}
