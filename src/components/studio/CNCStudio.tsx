"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { useShareableNumbers } from "@/lib/studioKit";
import { useState } from "react";

const MAT: Record<string, number> = { Aluminum: 300, "Mild steel": 90, "Stainless": 55, Titanium: 40, Brass: 200 };

const PRESETS: Record<string, { diameter: number; teeth: number; feedPerTooth: number; doc: number }> = {
  "Alu roughing": { diameter: 12, teeth: 3, feedPerTooth: 0.1, doc: 5 },
  "Steel finish": { diameter: 6, teeth: 4, feedPerTooth: 0.03, doc: 0.5 },
  "Deep slot": { diameter: 8, teeth: 2, feedPerTooth: 0.05, doc: 4 },
  "Micro-mill": { diameter: 2, teeth: 2, feedPerTooth: 0.02, doc: 1 },
};

export function CNCStudio() {
  const [mat, setMat] = useState("Aluminum");
  const [{ diameter, teeth, feedPerTooth, doc }, update] = useShareableNumbers({ diameter: 10, teeth: 4, feedPerTooth: 0.05, doc: 2 });

  const Vc = MAT[mat]; // surface speed m/min
  const rpm = Vc * 1000 / (Math.PI * diameter);
  const feedRate = rpm * feedPerTooth * teeth; // mm/min
  const mrr = feedRate * doc * diameter / 1000; // cm^3/min (approx width = diameter)

  const explain =
    diameter <= 4
      ? "Cutting speed is fixed by the material, so this small-diameter tool has to spin fast — halving the tool diameter nearly doubles the required RPM."
      : feedPerTooth >= 0.12
      ? "A heavy chip load per tooth drives up both feed rate and removal rate, but risks tool deflection and chatter — back off if the finish suffers."
      : `Feed rate is RPM times chip load times flute count, so adding flutes or feed lifts throughput here to about ${mrr.toFixed(1)} cm³/min without changing the surface speed.`;

  const code = `import math
Vc, d, teeth, fz, doc = ${Vc}, ${diameter}, ${teeth}, ${feedPerTooth}, ${doc}
rpm = Vc * 1000 / (math.pi * d)
feed = rpm * fz * teeth              # mm/min
mrr = feed * doc * d / 1000          # cm^3/min
print("rpm", round(rpm), "feed", round(feed), "mrr", round(mrr, 1))`;

  return (
    <StudioChrome title="CNC Feeds & Speeds" tagline="cutting parameters"
      controls={<div>
        <div className="mb-3 grid grid-cols-3 gap-1">{Object.keys(MAT).map((k) => <button key={k} onClick={() => setMat(k)} className={`rounded-lg px-1 py-1 text-xs font-semibold ${mat === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{k}</button>)}</div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Tool diameter (mm)" value={diameter} min={1} max={25} step={0.5} onChange={(v) => update({ diameter: v })} />
        <Slider label="Number of teeth" value={teeth} min={1} max={8} step={1} onChange={(v) => update({ teeth: v })} />
        <Slider label="Feed per tooth (mm)" value={feedPerTooth} min={0.01} max={0.2} step={0.01} onChange={(v) => update({ feedPerTooth: v })} />
        <Slider label="Depth of cut (mm)" value={doc} min={0.5} max={10} step={0.5} onChange={(v) => update({ doc: v })} />
        <p className="mt-3 text-xs text-slate-500">Machining a part right means matching spindle speed and feed to the material. The cutting speed (surface meters per minute) sets the RPM for a given tool diameter; the feed rate is RPM times chip load per tooth times the number of teeth. Too fast burns the tool; too slow rubs and work-hardens. The material removal rate is your productivity.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Spindle speed" value={`${rpm.toFixed(0)} RPM`} /><Stat label="Feed rate" value={`${feedRate.toFixed(0)} mm/min`} /><Stat label="Cutting speed" value={`${Vc} m/min`} /><Stat label="Material removal" value={`${mrr.toFixed(1)} cm³/min`} /><ExplainResult text={explain} /></div>}
    ><div className="flex flex-col items-center justify-center gap-6 py-16">
        <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-center">
          <div><div className="text-4xl font-black text-cyan-400">{rpm.toFixed(0)}</div><div className="mt-1 text-xs text-slate-500">spindle RPM</div></div>
          <div><div className="text-4xl font-black text-lime-400">{feedRate.toFixed(0)}</div><div className="mt-1 text-xs text-slate-500">feed mm/min</div></div>
        </div>
        <div className="text-sm text-slate-500">{mat} · ⌀{diameter}mm · {teeth} flutes</div>
      </div></StudioChrome>
  );
}
