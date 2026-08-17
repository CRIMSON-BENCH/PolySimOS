"use client";

import { useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const SIGMA = 5.670374e-8;

export function EnergyBalanceStudio() {
  const [solar, setSolar] = useState(1361); // W/m^2
  const [albedo, setAlbedo] = useState(0.3);
  const [emissivity, setEmissivity] = useState(0.62); // effective emissivity (greenhouse when <1)

  const absorbed = solar * (1 - albedo) / 4; // averaged over sphere
  const Tnoatm = Math.pow(solar * (1 - albedo) / (4 * SIGMA), 0.25); // no greenhouse
  const Tsurf = Math.pow(absorbed / (emissivity * SIGMA), 0.25);
  const greenhouseC = Tsurf - Tnoatm;
  const tC = Tsurf - 273.15;

  const color = tC < -10 ? "#93c5fd" : tC < 5 ? "#67e8f9" : tC < 20 ? "#a3e635" : tC < 35 ? "#fbbf24" : "#f97316";

  return (
    <StudioChrome title="Planetary Energy Balance" tagline="greenhouse effect · equilibrium temperature"
      controls={<div>
        <Slider label="Solar constant (W/m²)" value={solar} min={800} max={2000} step={10} onChange={setSolar} />
        <Slider label="Albedo (reflectivity)" value={albedo} min={0} max={0.8} step={0.01} onChange={setAlbedo} />
        <Slider label="Effective emissivity" value={emissivity} min={0.3} max={1} step={0.01} onChange={setEmissivity} />
        <div className="mt-3 flex flex-wrap gap-1">{[["Earth", 1361, 0.3, 0.62], ["Mars", 586, 0.25, 0.95], ["Venus", 2601, 0.75, 0.014], ["Moon", 1361, 0.11, 1]].map(([n, s, a, e]) => <button key={n as string} onClick={() => { setSolar(s as number); setAlbedo(a as number); setEmissivity(e as number); }} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-400">{n}</button>)}</div>
        <p className="mt-3 text-xs text-slate-500">A planet warms until it radiates away exactly the sunlight it absorbs. Balancing absorbed power S(1−α)/4 against εσT⁴ gives the equilibrium temperature. An emissivity below 1 represents greenhouse gases trapping outgoing infrared, raising the surface temperature.</p>
      </div>}
      inspector={<div><Stat label="Absorbed power" value={`${absorbed.toFixed(0)} W/m²`} /><Stat label="No-greenhouse T" value={`${(Tnoatm - 273.15).toFixed(1)} °C`} /><Stat label="Greenhouse warming" value={`+${greenhouseC.toFixed(1)} °C`} /></div>}
    ><div className="flex flex-col items-center justify-center py-16">
        <div className="text-xs uppercase tracking-widest text-slate-500">Equilibrium surface temperature</div>
        <div className="mt-3 text-7xl font-black" style={{ color }}>{tC.toFixed(1)}<span className="ml-2 text-3xl text-slate-400">°C</span></div>
        <div className="mt-2 text-sm text-slate-500">{Tsurf.toFixed(1)} K</div>
      </div></StudioChrome>
  );
}
