"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { useShareableNumbers } from "@/lib/studioKit";
import { useState } from "react";

const PRESETS: Record<string, { electricity: number; driving: number; flights: number }> = {
  "Low-carbon": { electricity: 150, driving: 3000, flights: 0 },
  "EU average": { electricity: 350, driving: 12000, flights: 3 },
  "US suburban": { electricity: 900, driving: 20000, flights: 6 },
  "Frequent flyer": { electricity: 500, driving: 15000, flights: 20 },
};

export function CarbonFootprintStudio() {
  const [{ electricity, driving, flights }, update] = useShareableNumbers({ electricity: 400, driving: 15000, flights: 4 });
  const [diet, setDiet] = useState(1); // 0 vegan..3 heavy meat

  const gridIntensity = 0.4; // kg CO2/kWh
  const elec = electricity * 12 * gridIntensity / 1000; // tonnes
  const car = driving * 0.15 / 1000; const air = flights * 0.5; const dietT = [1.5, 2.5, 3.3, 4.7][diet];
  const total = elec + car + air + dietT;
  const parts = [["Electricity", elec, "#fbbf24"], ["Driving", car, "#22d3ee"], ["Flights", air, "#f472b6"], ["Diet", dietT, "#a3e635"]] as const;

  const top = parts.reduce((a, b) => (b[1] > a[1] ? b : a), parts[0]);
  const explain =
    total <= 2
      ? `At ${total.toFixed(1)} t you are at or below the ~2 t livable-planet target — a rare place to be, driven by keeping ${top[0].toLowerCase()} low.`
      : `${top[0]} is your single biggest slice at ${top[1].toFixed(1)} t of the ${total.toFixed(1)} t total, so that is where a cut moves the needle most — one long-haul flight can outweigh a whole year of driving.`;

  const code = `# annual carbon footprint (tonnes CO2)
electricity, driving, flights, diet = ${electricity}, ${driving}, ${flights}, ${diet}
elec = electricity * 12 * 0.4 / 1000   # kWh/mo x grid intensity
car  = driving * 0.15 / 1000           # km/yr x g/km
air  = flights * 0.5                   # short-haul equiv
diet_t = [1.5, 2.5, 3.3, 4.7][diet]    # vegan..heavy meat
total = elec + car + air + diet_t
print(round(total, 1), "t CO2/yr")`;

  return (
    <StudioChrome title="Carbon Footprint" tagline="your annual CO₂ in tonnes"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Electricity (kWh/month)" value={electricity} min={0} max={2000} step={50} onChange={(v) => update({ electricity: v })} />
        <Slider label="Driving (km/year)" value={driving} min={0} max={40000} step={1000} onChange={(v) => update({ driving: v })} />
        <Slider label="Flights (short-haul/yr)" value={flights} min={0} max={30} step={1} onChange={(v) => update({ flights: v })} />
        <div className="mt-3"><div className="mb-1 text-xs text-slate-500">Diet</div><div className="grid grid-cols-4 gap-1">{["Vegan", "Veggie", "Average", "Heavy meat"].map((d, i) => <button key={d} onClick={() => setDiet(i)} className={`rounded-lg px-1 py-1 text-xs font-semibold ${diet === i ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{d}</button>)}</div></div>
        <p className="mt-3 text-xs text-slate-500">Your carbon footprint is the sum of the greenhouse gases your lifestyle emits each year. The big levers are usually flying, driving, home energy, and diet. The global average is about 4.7 tonnes per person, but a livable-planet target is closer to 2 tonnes. Estimates use typical emission factors and will vary by region.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Total footprint" value={`${total.toFixed(1)} t CO₂/yr`} /><Stat label="vs global avg" value={`${(total / 4.7).toFixed(1)}×`} /><Stat label="vs 2t target" value={total <= 2 ? "on target" : `${(total / 2).toFixed(1)}× over`} /><ExplainResult text={explain} /></div>}
    ><div className="p-4">
        <div className="mb-4 text-center"><div className="text-5xl font-black text-cyan-400">{total.toFixed(1)}</div><div className="text-xs text-slate-500">tonnes CO₂ per year</div></div>
        {parts.map(([n, v, c]) => (
          <div key={n} className="mb-2 flex items-center gap-2">
            <div className="w-20 shrink-0 text-right text-xs text-slate-400">{n}</div>
            <div className="h-5 flex-1 rounded bg-slate-800"><div className="h-5 rounded" style={{ width: `${Math.min(100, v / total * 100)}%`, backgroundColor: c }} /></div>
            <div className="w-16 shrink-0 text-xs text-slate-500">{v.toFixed(1)} t</div>
          </div>
        ))}
      </div></StudioChrome>
  );
}
