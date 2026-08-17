"use client";

import { useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Fireground hydraulics: friction loss FL = C * (Q/100)^2 * (L/100)
const COEFF: Record<string, number> = { "1¾\"": 15.5, "2½\"": 2, "3\"": 0.8, "4\"": 0.2, "5\"": 0.08 };

export function HoseFlowStudio() {
  const [hose, setHose] = useState('2½"');
  const [flow, setFlow] = useState(250); // GPM
  const [length, setLength] = useState(200); // ft
  const [nozzle, setNozzle] = useState(100); // nozzle pressure psi
  const [elevation, setElevation] = useState(0); // ft (floors * 10 or feet)

  const C = COEFF[hose];
  const FL = C * Math.pow(flow / 100, 2) * (length / 100);
  const EP = 0.434 * elevation; // psi per foot of elevation
  const PDP = nozzle + FL + EP; // pump discharge pressure

  return (
    <StudioChrome title="Fire Hose Hydraulics" tagline="friction loss · pump discharge pressure"
      controls={<div>
        <div className="mb-3"><div className="mb-1 text-xs font-semibold text-slate-500">Hose diameter</div>
          <div className="grid grid-cols-5 gap-1">{Object.keys(COEFF).map((h) => <button key={h} onClick={() => setHose(h)} className={`rounded-lg px-1 py-1.5 text-xs font-semibold ${hose === h ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{h}</button>)}</div></div>
        <Slider label="Flow (GPM)" value={flow} min={30} max={800} step={10} onChange={setFlow} />
        <Slider label="Hose length (ft)" value={length} min={50} max={1000} step={50} onChange={setLength} />
        <Slider label="Nozzle pressure (psi)" value={nozzle} min={50} max={100} step={5} onChange={setNozzle} />
        <Slider label="Elevation (ft)" value={elevation} min={-50} max={200} step={10} onChange={setElevation} />
        <p className="mt-3 text-xs text-slate-500">Friction loss uses the fireground formula FL = C·(Q/100)²·(L/100), added to nozzle pressure and elevation head to give the required pump discharge pressure. Coefficients are standard single-line values. Verify against your department&apos;s charts.</p>
      </div>}
      inspector={<div><Stat label="Friction loss" value={`${FL.toFixed(0)} psi`} /><Stat label="Elevation" value={`${EP.toFixed(0)} psi`} /><Stat label="Coefficient C" value={String(C)} /></div>}
    ><div className="flex flex-col items-center justify-center py-16">
        <div className="text-xs uppercase tracking-widest text-slate-500">Required pump discharge pressure</div>
        <div className="mt-3 text-6xl font-black text-cyan-500">{PDP.toFixed(0)}<span className="ml-2 text-2xl text-slate-400">psi</span></div>
        <div className="mt-6 grid grid-cols-3 gap-6 text-center text-sm">
          <div><div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{nozzle}</div><div className="text-xs text-slate-500">nozzle</div></div>
          <div><div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{FL.toFixed(0)}</div><div className="text-xs text-slate-500">friction</div></div>
          <div><div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{EP.toFixed(0)}</div><div className="text-xs text-slate-500">elevation</div></div>
        </div>
      </div></StudioChrome>
  );
}
