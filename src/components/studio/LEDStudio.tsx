"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { gap: number }> = {
  "Red": { gap: 1.9 },
  "Green": { gap: 2.3 },
  "Blue": { gap: 2.7 },
  "UV": { gap: 3.3 },
};

// LED: band gap -> emission wavelength/color.
function wl2rgb(wl: number): string {
  let r = 0, g = 0, b = 0;
  if (wl < 440) { r = -(wl - 440) / 60; b = 1; } else if (wl < 490) { g = (wl - 440) / 50; b = 1; }
  else if (wl < 510) { g = 1; b = -(wl - 510) / 20; } else if (wl < 580) { r = (wl - 510) / 70; g = 1; }
  else if (wl < 645) { r = 1; g = -(wl - 645) / 65; } else { r = 1; }
  return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
}

export function LEDStudio() {
  const [{ gap }, update] = useShareableNumbers({ gap: 2.1 }); // eV
  const wl = 1240 / gap; // nm
  const visible = wl >= 380 && wl <= 750;
  const material = gap > 3.0 ? "GaN (UV/blue)" : gap > 2.4 ? "InGaN (blue-green)" : gap > 1.9 ? "GaP/AlInGaP (green-red)" : gap > 1.4 ? "GaAs (red-IR)" : "InGaAsP (infrared)";

  const explain =
    wl < 380
      ? `A ${gap.toFixed(2)} eV gap packs more than 3.26 eV into each photon, so emission lands at ${wl.toFixed(0)} nm — past violet into the invisible ultraviolet.`
      : wl > 750
      ? `At only ${gap.toFixed(2)} eV each photon is too low-energy to see; the ${wl.toFixed(0)} nm output is infrared, the band used by remote controls.`
      : `λ = 1240/Eg puts this ${gap.toFixed(2)} eV gap at ${wl.toFixed(0)} nm — a wider gap means a bluer photon, which is exactly why blue LEDs needed the high-gap GaN family.`;

  const code = `gap = ${gap}          # band gap in eV
wl = 1240 / gap       # emission wavelength in nm (lambda = 1240 / Eg)
region = "visible" if 380 <= wl <= 750 else ("UV" if wl < 380 else "IR")
print(round(wl), "nm", region)`;

  return (
    <StudioChrome title="LED Band Gap & Color" tagline="from energy gap to photon"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Band gap Eg (eV)" value={gap} min={0.8} max={3.4} step={0.02} onChange={(v) => update({ gap: v })} />
        <p className="mt-3 text-xs text-slate-500">An LED emits light when electrons drop across the semiconductor&apos;s band gap, each releasing a photon of energy equal to that gap. Since photon energy fixes wavelength (λ = 1240/Eg in nm), the band gap directly sets the color — which is why blue LEDs needed a whole new material (gallium nitride) and a Nobel Prize to achieve.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Wavelength" value={`${wl.toFixed(0)} nm`} /><Stat label="Region" value={wl < 380 ? "ultraviolet" : wl > 750 ? "infrared" : "visible"} /><Stat label="Material" value={material} /><Equation tex={`\\lambda = \\frac{hc}{E_g} = \\frac{1240}{${gap.toFixed(2)}\\ \\text{eV}} = ${wl.toFixed(0)}\\ \\text{nm}`} /><ExplainResult text={explain} /></div>}
    ><div className="flex flex-col items-center justify-center py-16">
        <div className="h-40 w-40 rounded-full" style={{ backgroundColor: visible ? wl2rgb(wl) : "#1e293b", boxShadow: visible ? `0 0 60px ${wl2rgb(wl)}` : "none" }} />
        <div className="mt-6 text-4xl font-black text-slate-100">{wl.toFixed(0)} nm</div>
        <div className="mt-1 text-sm text-slate-500">{gap.toFixed(2)} eV band gap {visible ? "" : "(invisible)"}</div>
      </div></StudioChrome>
  );
}
