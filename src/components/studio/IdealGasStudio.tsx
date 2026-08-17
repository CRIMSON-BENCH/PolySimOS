"use client";

import { useMemo, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function IdealGasStudio() {
  const [n, setN] = useState(1);      // moles
  const [T, setT] = useState(300);    // K
  const [V, setV] = useState(24);     // liters

  const P = useMemo(() => (n * 8.314 * T) / (V / 1000) / 1000, [n, T, V]); // kPa

  return (
    <StudioChrome title="Ideal Gas Law (PV = nRT)" tagline="pressure · volume · temperature · moles"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Set moles, temperature, and volume — pressure follows from PV = nRT. Compress the volume or heat the gas and watch the pressure climb.</p>
        <Slider label="Moles (n)" value={n} min={0.2} max={5} step={0.1} onChange={setN} />
        <Slider label="Temperature (K)" value={T} min={100} max={800} step={10} onChange={setT} />
        <Slider label="Volume (L)" value={V} min={2} max={60} step={1} onChange={setV} />
      </div>}
      inspector={<div><Stat label="Pressure" value={`${P.toFixed(1)} kPa`} /><Stat label="≈ atm" value={(P / 101.325).toFixed(2)} /><Stat label="n·R·T" value={(n * 8.314 * T).toFixed(0)} /><Stat label="Law" value="PV = nRT" /></div>}
    >
      <div className="flex h-full min-h-[360px] items-center justify-center gap-10 p-8">
        <div className="relative flex h-72 w-40 flex-col justify-end rounded-lg border-2 border-slate-600 bg-slate-900/50">
          <div className="absolute inset-x-0 bg-cyan-500/30" style={{ height: `${Math.min(100, (V / 60) * 100)}%`, bottom: 0 }} />
          <div className="absolute inset-x-0 border-t-4 border-slate-400" style={{ bottom: `${Math.min(100, (V / 60) * 100)}%` }} />
          {Array.from({ length: Math.min(40, Math.round(n * 12)) }).map((_, i) => (
            <div key={i} className="absolute h-2 w-2 rounded-full bg-cyan-300" style={{ left: `${10 + (i * 37) % 80}%`, bottom: `${5 + (i * 53) % Math.max(10, (V / 60) * 90)}%` }} />
          ))}
        </div>
        <div className="text-center">
          <div className="text-sm text-slate-400">Pressure</div>
          <div className="text-5xl font-black text-cyan-400">{P.toFixed(0)}</div>
          <div className="text-sm text-slate-400">kPa ({(P / 101.325).toFixed(2)} atm)</div>
        </div>
      </div>
    </StudioChrome>
  );
}
