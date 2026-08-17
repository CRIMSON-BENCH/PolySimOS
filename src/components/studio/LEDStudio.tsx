"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { useState } from "react";

// LED: band gap -> emission wavelength/color.
function wl2rgb(wl: number): string {
  let r = 0, g = 0, b = 0;
  if (wl < 440) { r = -(wl - 440) / 60; b = 1; } else if (wl < 490) { g = (wl - 440) / 50; b = 1; }
  else if (wl < 510) { g = 1; b = -(wl - 510) / 20; } else if (wl < 580) { r = (wl - 510) / 70; g = 1; }
  else if (wl < 645) { r = 1; g = -(wl - 645) / 65; } else { r = 1; }
  return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
}

export function LEDStudio() {
  const [gap, setGap] = useState(2.1); // eV
  const wl = 1240 / gap; // nm
  const visible = wl >= 380 && wl <= 750;
  const material = gap > 3.0 ? "GaN (UV/blue)" : gap > 2.4 ? "InGaN (blue-green)" : gap > 1.9 ? "GaP/AlInGaP (green-red)" : gap > 1.4 ? "GaAs (red-IR)" : "InGaAsP (infrared)";

  return (
    <StudioChrome title="LED Band Gap & Color" tagline="from energy gap to photon"
      controls={<div>
        <Slider label="Band gap Eg (eV)" value={gap} min={0.8} max={3.4} step={0.02} onChange={setGap} />
        <div className="mt-3 flex flex-wrap gap-1">{[["Red", 1.9], ["Green", 2.3], ["Blue", 2.7], ["UV", 3.3]].map(([n, g]) => <button key={n as string} onClick={() => setGap(g as number)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-400">{n}</button>)}</div>
        <p className="mt-3 text-xs text-slate-500">An LED emits light when electrons drop across the semiconductor&apos;s band gap, each releasing a photon of energy equal to that gap. Since photon energy fixes wavelength (λ = 1240/Eg in nm), the band gap directly sets the color — which is why blue LEDs needed a whole new material (gallium nitride) and a Nobel Prize to achieve.</p>
      </div>}
      inspector={<div><Stat label="Wavelength" value={`${wl.toFixed(0)} nm`} /><Stat label="Region" value={wl < 380 ? "ultraviolet" : wl > 750 ? "infrared" : "visible"} /><Stat label="Material" value={material} /></div>}
    ><div className="flex flex-col items-center justify-center py-16">
        <div className="h-40 w-40 rounded-full" style={{ backgroundColor: visible ? wl2rgb(wl) : "#1e293b", boxShadow: visible ? `0 0 60px ${wl2rgb(wl)}` : "none" }} />
        <div className="mt-6 text-4xl font-black text-slate-100">{wl.toFixed(0)} nm</div>
        <div className="mt-1 text-sm text-slate-500">{gap.toFixed(2)} eV band gap {visible ? "" : "(invisible)"}</div>
      </div></StudioChrome>
  );
}
