"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { useState } from "react";

// Radiation dose: inverse-square + time, compared to reference doses.
export function RadiationDoseStudio() {
  const [activity, setActivity] = useState(37); // MBq
  const [distance, setDistance] = useState(1); // m
  const [time, setTime] = useState(1); // hr

  // dose-rate constant (approx, mSv/hr per MBq at 1 m for Cs-137 ~ 8.4e-5)
  const gamma = 8.4e-5; const doseRate = gamma * activity / (distance * distance); // mSv/hr
  const dose = doseRate * time; // mSv
  const bananas = dose / 0.0001; // 0.1 uSv per banana
  const refs = [["Dental X-ray", 0.005], ["Chest X-ray", 0.1], ["Annual limit (public)", 1], ["CT scan", 7], ["Annual limit (worker)", 20]] as const;
  const risk = dose < 1 ? "very low" : dose < 20 ? "occupational range" : dose < 1000 ? "elevated" : "acute — dangerous";

  return (
    <StudioChrome title="Radiation Dose" tagline="exposure, distance & time"
      controls={<div>
        <Slider label="Source activity (MBq)" value={activity} min={1} max={10000} step={1} onChange={setActivity} />
        <Slider label="Distance (m)" value={distance} min={0.1} max={10} step={0.1} onChange={setDistance} />
        <Slider label="Exposure time (hr)" value={time} min={0.1} max={24} step={0.1} onChange={setTime} />
        <p className="mt-3 text-xs text-slate-500">The three ways to reduce radiation dose are time, distance, and shielding. Dose builds with exposure time but falls with the square of distance — doubling your distance quarters the dose. Effective dose in millisieverts lets you compare any exposure to everyday references like a chest X-ray or the annual background dose. Educational estimate only.</p>
      </div>}
      inspector={<div><Stat label="Dose rate" value={`${doseRate.toFixed(4)} mSv/hr`} /><Stat label="Total dose" value={`${dose.toFixed(3)} mSv`} /><Stat label="≈ bananas" value={bananas.toFixed(0)} /><Stat label="Risk level" value={risk} /></div>}
    ><div className="p-4">
        <div className="mb-3 text-center text-xs uppercase tracking-widest text-slate-500">Your dose vs common references (mSv, log scale)</div>
        {[["Your exposure", dose] as const, ...refs].map(([n, d]) => (
          <div key={n} className="mb-2 flex items-center gap-2">
            <div className="w-40 shrink-0 text-right text-xs text-slate-400">{n}</div>
            <div className="h-4 flex-1 rounded bg-slate-800"><div className="h-4 rounded" style={{ width: `${Math.min(100, (Math.log10(d + 0.001) + 3) / 5 * 100)}%`, backgroundColor: n === "Your exposure" ? "#f472b6" : "#22d3ee" }} /></div>
            <div className="w-16 shrink-0 text-xs text-slate-500">{d < 0.01 ? d.toFixed(4) : d.toFixed(2)}</div>
          </div>
        ))}
      </div></StudioChrome>
  );
}
