"use client";

import { useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { useShareableNumbers } from "@/lib/studioKit";

// Fireground hydraulics: friction loss FL = C * (Q/100)^2 * (L/100)
const COEFF: Record<string, number> = { "1¾\"": 15.5, "2½\"": 2, "3\"": 0.8, "4\"": 0.2, "5\"": 0.08 };

const PRESETS: Record<string, { flow: number; length: number; nozzle: number; elevation: number }> = {
  "Handline": { flow: 150, length: 200, nozzle: 100, elevation: 0 },
  "Master stream": { flow: 500, length: 100, nozzle: 80, elevation: 0 },
  "High-rise (10 fl)": { flow: 250, length: 150, nozzle: 100, elevation: 100 },
  "Long supply lay": { flow: 300, length: 800, nozzle: 100, elevation: 0 },
};

export function HoseFlowStudio() {
  const [hose, setHose] = useState('2½"');
  const [{ flow, length, nozzle, elevation }, update] = useShareableNumbers({
    flow: 250, // GPM
    length: 200, // ft
    nozzle: 100, // nozzle pressure psi
    elevation: 0, // ft (floors * 10 or feet)
  });

  const C = COEFF[hose];
  const FL = C * Math.pow(flow / 100, 2) * (length / 100);
  const EP = 0.434 * elevation; // psi per foot of elevation
  const PDP = nozzle + FL + EP; // pump discharge pressure

  const explain =
    FL > PDP * 0.5
      ? `Friction loss (${FL.toFixed(0)} psi) is over half the required pressure — because loss grows with the square of flow, cutting GPM or upsizing hose helps far more than raising nozzle pressure.`
      : EP < 0
      ? `The line runs downhill, so elevation returns ${Math.abs(EP).toFixed(0)} psi and the pump works easier than nozzle pressure alone implies.`
      : elevation > 0
      ? `Every 10 ft of climb adds ~4.3 psi of head, so this ${elevation}-ft lift costs ${EP.toFixed(0)} psi on top of friction.`
      : `Friction loss is modest here, so nozzle pressure sets most of the ${PDP.toFixed(0)}-psi discharge the pump must supply.`;

  const code = `# Fire hose hydraulics (fireground formula)
C = ${C}  # ${hose} coefficient
Q, L, NP, elev = ${flow}, ${length}, ${nozzle}, ${elevation}
FL = C * (Q / 100) ** 2 * (L / 100)   # friction loss, psi
EP = 0.434 * elev                     # elevation head, psi
PDP = NP + FL + EP                    # pump discharge pressure
print("friction loss", round(FL), "psi")
print("pump discharge pressure", round(PDP), "psi")`;

  return (
    <StudioChrome title="Fire Hose Hydraulics" tagline="friction loss · pump discharge pressure"
      controls={<div>
        <div className="mb-3"><div className="mb-1 text-xs font-semibold text-slate-500">Hose diameter</div>
          <div className="grid grid-cols-5 gap-1">{Object.keys(COEFF).map((h) => <button key={h} onClick={() => setHose(h)} className={`rounded-lg px-1 py-1.5 text-xs font-semibold ${hose === h ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{h}</button>)}</div></div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Flow (GPM)" value={flow} min={30} max={800} step={10} onChange={(v) => update({ flow: v })} />
        <Slider label="Hose length (ft)" value={length} min={50} max={1000} step={50} onChange={(v) => update({ length: v })} />
        <Slider label="Nozzle pressure (psi)" value={nozzle} min={50} max={100} step={5} onChange={(v) => update({ nozzle: v })} />
        <Slider label="Elevation (ft)" value={elevation} min={-50} max={200} step={10} onChange={(v) => update({ elevation: v })} />
        <p className="mt-3 text-xs text-slate-500">Friction loss uses the fireground formula FL = C·(Q/100)²·(L/100), added to nozzle pressure and elevation head to give the required pump discharge pressure. Coefficients are standard single-line values. Verify against your department&apos;s charts.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Friction loss" value={`${FL.toFixed(0)} psi`} /><Stat label="Elevation" value={`${EP.toFixed(0)} psi`} /><Stat label="Coefficient C" value={String(C)} /><Equation tex={`\\mathrm{PDP} = \\mathrm{NP} + C\\!\\left(\\tfrac{Q}{100}\\right)^{2}\\tfrac{L}{100} + 0.434\\,h = ${nozzle} + ${FL.toFixed(0)} + ${EP.toFixed(0)} = ${PDP.toFixed(0)}\\ \\mathrm{psi}`} /><ExplainResult text={explain} /></div>}
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
