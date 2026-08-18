"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { T: number; rh: number }> = {
  "Comfortable": { T: 22, rh: 40 },
  "Muggy summer": { T: 32, rh: 70 },
  "Desert dry": { T: 40, rh: 10 },
  "Cold winter": { T: 0, rh: 60 },
};

// Humidity relations: dew point, wet bulb from T and RH.
export function PsychrometricsStudio() {
  const [{ T, rh }, update] = useShareableNumbers({ T: 25, rh: 50 });

  const es = (t: number) => 6.112 * Math.exp(17.67 * t / (t + 243.5)); // saturation vapor pressure hPa
  const e = es(T) * rh / 100; // actual vapor pressure
  // dew point (Magnus)
  const gamma = Math.log(rh / 100) + 17.67 * T / (T + 243.5); const dew = 243.5 * gamma / (17.67 - gamma);
  // wet bulb (Stull approximation)
  const wb = T * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) + Math.atan(T + rh) - Math.atan(rh - 1.676331) + 0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) - 4.686035;
  // mixing ratio g/kg at 1013 hPa
  const w = 622 * e / (1013 - e);
  const comfort = dew < 10 ? "dry / comfortable" : dew < 16 ? "pleasant" : dew < 21 ? "sticky" : dew < 24 ? "uncomfortable" : "oppressive";

  const explain =
    dew >= 24
      ? `A dew point of ${dew.toFixed(1)} °C is oppressive — the air holds so much moisture that sweat barely evaporates and it feels heavy.`
      : dew < 10
      ? `A low dew point of ${dew.toFixed(1)} °C means the air is dry, so evaporative cooling works well and it feels comfortable despite the ${T.toFixed(0)} °C reading.`
      : wb >= 31
      ? `The wet-bulb temperature of ${wb.toFixed(1)} °C approaches the survivability limit, where evaporative cooling can no longer shed body heat.`
      : `Dew point ${dew.toFixed(1)} °C sits in the ${comfort} range; the wet bulb (${wb.toFixed(1)} °C) marks the coolest that evaporation can reach here.`;

  const code = `import numpy as np
T, rh = ${T}, ${rh}
es = lambda t: 6.112 * np.exp(17.67 * t / (t + 243.5))
e = es(T) * rh / 100
gamma = np.log(rh / 100) + 17.67 * T / (T + 243.5)
dew = 243.5 * gamma / (17.67 - gamma)
wb = (T * np.arctan(0.151977 * np.sqrt(rh + 8.313659)) + np.arctan(T + rh)
      - np.arctan(rh - 1.676331) + 0.00391838 * rh ** 1.5 * np.arctan(0.023101 * rh) - 4.686035)
w = 622 * e / (1013 - e)
print("dew", round(dew, 1), "wet_bulb", round(wb, 1), "mixing", round(w, 1))`;

  return (
    <StudioChrome title="Humidity & Psychrometrics" tagline="dew point, wet bulb, mixing ratio"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Air temperature (°C)" value={T} min={-10} max={45} step={0.5} onChange={(v) => update({ T: v })} />
        <Slider label="Relative humidity (%)" value={rh} min={5} max={100} step={1} onChange={(v) => update({ rh: v })} />
        <p className="mt-3 text-xs text-slate-500">Relative humidity alone is misleading. The dew point — the temperature at which air saturates — is the honest measure of how muggy it feels and where clouds or condensation form. The wet-bulb temperature, always between dew point and air temperature, is what evaporative cooling can reach and a key limit for human survivability in extreme heat.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Dew point" value={`${dew.toFixed(1)} °C`} /><Stat label="Wet-bulb temp" value={`${wb.toFixed(1)} °C`} /><Stat label="Mixing ratio" value={`${w.toFixed(1)} g/kg`} /><Stat label="Comfort" value={comfort} /><ExplainResult text={explain} /></div>}
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
