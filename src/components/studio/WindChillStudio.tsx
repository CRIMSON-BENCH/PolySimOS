"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { useState } from "react";

// Wind chill (cold) + heat index (hot) apparent temperature.
export function WindChillStudio() {
  const [tempC, setTempC] = useState(-5);
  const [wind, setWind] = useState(30); // km/h
  const [humidity, setHumidity] = useState(60);

  const T = tempC * 9 / 5 + 32; // F
  let apparentF = T;
  if (tempC <= 10 && wind >= 4.8) { const V = wind * 0.621371; apparentF = 35.74 + 0.6215 * T - 35.75 * Math.pow(V, 0.16) + 0.4275 * T * Math.pow(V, 0.16); }
  else if (tempC >= 27) { const H = humidity; apparentF = -42.379 + 2.04901523 * T + 10.14333127 * H - 0.22475541 * T * H - 0.00683783 * T * T - 0.05481717 * H * H + 0.00122874 * T * T * H + 0.00085282 * T * H * H - 0.00000199 * T * T * H * H; }
  const apparentC = (apparentF - 32) * 5 / 9; const diff = apparentC - tempC;
  const mode = tempC <= 10 ? "wind chill" : tempC >= 27 ? "heat index" : "neutral";
  const risk = mode === "wind chill" && apparentC < -27 ? "frostbite risk" : mode === "heat index" && apparentC > 40 ? "heat danger" : "—";

  return (
    <StudioChrome title="Wind Chill & Heat Index" tagline="what it really feels like"
      controls={<div>
        <Slider label="Air temperature (°C)" value={tempC} min={-40} max={45} step={1} onChange={setTempC} />
        <Slider label="Wind speed (km/h)" value={wind} min={0} max={80} step={2} onChange={setWind} />
        <Slider label="Humidity (%)" value={humidity} min={0} max={100} step={5} onChange={setHumidity} />
        <p className="mt-3 text-xs text-slate-500">The thermometer only tells half the story. In the cold, wind strips away the thin warm layer around your skin, making it feel far colder — wind chill. In the heat, humidity blocks sweat from evaporating, making it feel hotter — the heat index. Both estimate the apparent temperature your body actually experiences.</p>
      </div>}
      inspector={<div><Stat label="Feels like" value={`${apparentC.toFixed(1)} °C`} /><Stat label="Difference" value={`${diff >= 0 ? "+" : ""}${diff.toFixed(1)} °C`} /><Stat label="Mode" value={mode} /><Stat label="Warning" value={risk} /></div>}
    ><div className="flex flex-col items-center justify-center py-16">
        <div className="text-xs uppercase tracking-widest text-slate-500">Apparent temperature</div>
        <div className="mt-3 text-7xl font-black" style={{ color: apparentC < 0 ? "#60a5fa" : apparentC > 32 ? "#f97316" : "#a3e635" }}>{apparentC.toFixed(0)}<span className="ml-2 text-3xl text-slate-400">°C</span></div>
        <div className="mt-2 text-sm text-slate-500">actual air temperature {tempC} °C</div>
      </div></StudioChrome>
  );
}
