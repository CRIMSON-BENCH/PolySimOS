"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { useState } from "react";

const MAT: Record<string, number> = { Aluminum: 300, "Mild steel": 90, "Stainless": 55, Titanium: 40, Brass: 200 };

export function CNCStudio() {
  const [mat, setMat] = useState("Aluminum");
  const [diameter, setDiameter] = useState(10); // mm
  const [teeth, setTeeth] = useState(4);
  const [feedPerTooth, setFeedPerTooth] = useState(0.05); // mm
  const [doc, setDoc] = useState(2); // depth of cut mm

  const Vc = MAT[mat]; // surface speed m/min
  const rpm = Vc * 1000 / (Math.PI * diameter);
  const feedRate = rpm * feedPerTooth * teeth; // mm/min
  const mrr = feedRate * doc * diameter / 1000; // cm^3/min (approx width = diameter)

  return (
    <StudioChrome title="CNC Feeds & Speeds" tagline="cutting parameters"
      controls={<div>
        <div className="mb-3 grid grid-cols-3 gap-1">{Object.keys(MAT).map((k) => <button key={k} onClick={() => setMat(k)} className={`rounded-lg px-1 py-1 text-xs font-semibold ${mat === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{k}</button>)}</div>
        <Slider label="Tool diameter (mm)" value={diameter} min={1} max={25} step={0.5} onChange={setDiameter} />
        <Slider label="Number of teeth" value={teeth} min={1} max={8} step={1} onChange={setTeeth} />
        <Slider label="Feed per tooth (mm)" value={feedPerTooth} min={0.01} max={0.2} step={0.01} onChange={setFeedPerTooth} />
        <Slider label="Depth of cut (mm)" value={doc} min={0.5} max={10} step={0.5} onChange={setDoc} />
        <p className="mt-3 text-xs text-slate-500">Machining a part right means matching spindle speed and feed to the material. The cutting speed (surface meters per minute) sets the RPM for a given tool diameter; the feed rate is RPM times chip load per tooth times the number of teeth. Too fast burns the tool; too slow rubs and work-hardens. The material removal rate is your productivity.</p>
      </div>}
      inspector={<div><Stat label="Spindle speed" value={`${rpm.toFixed(0)} RPM`} /><Stat label="Feed rate" value={`${feedRate.toFixed(0)} mm/min`} /><Stat label="Cutting speed" value={`${Vc} m/min`} /><Stat label="Material removal" value={`${mrr.toFixed(1)} cm³/min`} /></div>}
    ><div className="flex flex-col items-center justify-center gap-6 py-16">
        <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-center">
          <div><div className="text-4xl font-black text-cyan-400">{rpm.toFixed(0)}</div><div className="mt-1 text-xs text-slate-500">spindle RPM</div></div>
          <div><div className="text-4xl font-black text-lime-400">{feedRate.toFixed(0)}</div><div className="mt-1 text-xs text-slate-500">feed mm/min</div></div>
        </div>
        <div className="text-sm text-slate-500">{mat} · ⌀{diameter}mm · {teeth} flutes</div>
      </div></StudioChrome>
  );
}
