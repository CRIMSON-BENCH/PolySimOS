"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { useState } from "react";

// Humidity relations: dew point, wet bulb from T and RH.
export function PsychrometricsStudio() {
  const [T, setT] = useState(25);
  const [rh, setRh] = useState(50);

  const es = (t: number) => 6.112 * Math.exp(17.67 * t / (t + 243.5)); // saturation vapor pressure hPa
  const e = es(T) * rh / 100; // actual vapor pressure
  // dew point (Magnus)
  const gamma = Math.log(rh / 100) + 17.67 * T / (T + 243.5); const dew = 243.5 * gamma / (17.67 - gamma);
  // wet bulb (Stull approximation)
  const wb = T * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) + Math.atan(T + rh) - Math.atan(rh - 1.676331) + 0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) - 4.686035;
  // mixing ratio g/kg at 1013 hPa
  const w = 622 * e / (1013 - e);
  const comfort = dew < 10 ? "dry / comfortable" : dew < 16 ? "pleasant" : dew < 21 ? "sticky" : dew < 24 ? "uncomfortable" : "oppressive";

  return (
    <StudioChrome title="Humidity & Psychrometrics" tagline="dew point, wet bulb, mixing ratio"
      controls={<div>
        <Slider label="Air temperature (°C)" value={T} min={-10} max={45} step={0.5} onChange={setT} />
        <Slider label="Relative humidity (%)" value={rh} min={5} max={100} step={1} onChange={setRh} />
        <p className="mt-3 text-xs text-slate-500">Relative humidity alone is misleading. The dew point — the temperature at which air saturates — is the honest measure of how muggy it feels and where clouds or condensation form. The wet-bulb temperature, always between dew point and air temperature, is what evaporative cooling can reach and a key limit for human survivability in extreme heat.</p>
      </div>}
      inspector={<div><Stat label="Dew point" value={`${dew.toFixed(1)} °C`} /><Stat label="Wet-bulb temp" value={`${wb.toFixed(1)} °C`} /><Stat label="Mixing ratio" value={`${w.toFixed(1)} g/kg`} /><Stat label="Comfort" value={comfort} /></div>}
    ><div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div><div className="text-4xl font-black text-cyan-400">{T.toFixed(0)}°</div><div className="mt-1 text-xs text-slate-500">dry bulb</div></div>
          <div><div className="text-4xl font-black text-lime-400">{wb.toFixed(0)}°</div><div className="mt-1 text-xs text-slate-500">wet bulb</div></div>
          <div><div className="text-4xl font-black text-pink-400">{dew.toFixed(0)}°</div><div className="mt-1 text-xs text-slate-500">dew point</div></div>
        </div>
        <div className="text-sm text-slate-500">These three temperatures fully describe the moisture in the air.</div>
      </div></StudioChrome>
  );
}
