"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { tempC: number; wind: number; humidity: number }> = {
  "Arctic blast": { tempC: -25, wind: 45, humidity: 40 },
  "Chilly & windy": { tempC: -5, wind: 30, humidity: 60 },
  "Humid scorcher": { tempC: 35, wind: 5, humidity: 80 },
  "Mild day": { tempC: 15, wind: 10, humidity: 50 },
};

// Wind chill (cold) + heat index (hot) apparent temperature.
export function WindChillStudio() {
  const [{ tempC, wind, humidity }, update] = useShareableNumbers({ tempC: -5, wind: 30, humidity: 60 });

  const T = tempC * 9 / 5 + 32; // F
  let apparentF = T;
  if (tempC <= 10 && wind >= 4.8) { const V = wind * 0.621371; apparentF = 35.74 + 0.6215 * T - 35.75 * Math.pow(V, 0.16) + 0.4275 * T * Math.pow(V, 0.16); }
  else if (tempC >= 27) { const H = humidity; apparentF = -42.379 + 2.04901523 * T + 10.14333127 * H - 0.22475541 * T * H - 0.00683783 * T * T - 0.05481717 * H * H + 0.00122874 * T * T * H + 0.00085282 * T * H * H - 0.00000199 * T * T * H * H; }
  const apparentC = (apparentF - 32) * 5 / 9; const diff = apparentC - tempC;
  const mode = tempC <= 10 ? "wind chill" : tempC >= 27 ? "heat index" : "neutral";
  const risk = mode === "wind chill" && apparentC < -27 ? "frostbite risk" : mode === "heat index" && apparentC > 40 ? "heat danger" : "—";

  const explain =
    mode === "wind chill"
      ? `At ${wind} km/h the wind strips ${Math.abs(diff).toFixed(0)} °C off the air temperature, so exposed skin feels like ${apparentC.toFixed(0)} °C${risk === "frostbite risk" ? " — cold enough to threaten frostbite." : "."}`
      : mode === "heat index"
      ? `${humidity}% humidity blocks sweat from evaporating, pushing the apparent temperature ${diff >= 0 ? "up" : "down"} to ${apparentC.toFixed(0)} °C${risk === "heat danger" ? " — into the heat-danger range." : "."}`
      : `Between about 10 and 27 °C neither wind chill nor humidity dominates, so it feels close to the actual ${tempC} °C.`;

  const code = `import numpy as np
temp_c, wind_kmh, humidity = ${tempC}, ${wind}, ${humidity}
T = temp_c * 9 / 5 + 32
if temp_c <= 10 and wind_kmh >= 4.8:
    V = wind_kmh * 0.621371
    app_f = 35.74 + 0.6215 * T - 35.75 * V**0.16 + 0.4275 * T * V**0.16
elif temp_c >= 27:
    H = humidity
    app_f = (-42.379 + 2.04901523*T + 10.14333127*H - 0.22475541*T*H
             - 0.00683783*T*T - 0.05481717*H*H + 0.00122874*T*T*H
             + 0.00085282*T*H*H - 0.00000199*T*T*H*H)
else:
    app_f = T
print("feels like", round((app_f - 32) * 5 / 9, 1), "C")`;

  return (
    <StudioChrome title="Wind Chill & Heat Index" tagline="what it really feels like"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Air temperature (°C)" value={tempC} min={-40} max={45} step={1} onChange={(v) => update({ tempC: v })} />
        <Slider label="Wind speed (km/h)" value={wind} min={0} max={80} step={2} onChange={(v) => update({ wind: v })} />
        <Slider label="Humidity (%)" value={humidity} min={0} max={100} step={5} onChange={(v) => update({ humidity: v })} />
        <p className="mt-3 text-xs text-slate-500">The thermometer only tells half the story. In the cold, wind strips away the thin warm layer around your skin, making it feel far colder — wind chill. In the heat, humidity blocks sweat from evaporating, making it feel hotter — the heat index. Both estimate the apparent temperature your body actually experiences.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Feels like" value={`${apparentC.toFixed(1)} °C`} /><Stat label="Difference" value={`${diff >= 0 ? "+" : ""}${diff.toFixed(1)} °C`} /><Stat label="Mode" value={mode} /><Stat label="Warning" value={risk} /><Equation tex={`T_{wc}=13.12+0.6215(${tempC})-11.37(${wind})^{0.16}+0.3965(${tempC})(${wind})^{0.16}=${apparentC.toFixed(1)}\\,^\\circ\\text{C}`} /><ExplainResult text={explain} /></div>}
    ><div className="flex flex-col items-center justify-center py-16">
        <div className="text-xs uppercase tracking-widest text-slate-500">Apparent temperature</div>
        <div className="mt-3 text-7xl font-black" style={{ color: apparentC < 0 ? "#60a5fa" : apparentC > 32 ? "#f97316" : "#a3e635" }}>{apparentC.toFixed(0)}<span className="ml-2 text-3xl text-slate-400">°C</span></div>
        <div className="mt-2 text-sm text-slate-500">actual air temperature {tempC} °C</div>
      </div></StudioChrome>
  );
}
