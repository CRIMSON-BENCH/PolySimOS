"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

// Photoelectric effect: KEmax = h f - phi.
const H_EV = 4.1357e-15; // eV·s

const PRESETS: Record<string, { freq: number; work: number }> = {
  "Sodium, green light": { freq: 6, work: 2.3 },
  "Zinc, UV": { freq: 12, work: 4.3 },
  "Below threshold": { freq: 4, work: 2.3 },
  "High-energy UV": { freq: 18, work: 4.5 },
};

export function PhotoelectricStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ freq, work }, update] = useShareableNumbers({ freq: 8, work: 2.3 });

  const f = freq * 1e14; const photonE = H_EV * f; const KE = photonE - work; const emits = KE > 0;
  const f0 = work / H_EV / 1e14; // threshold in 10^14 Hz

  useEffect(() => {
    const W = 520, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, oy = H - 40, pw = W - 80, ph = H - 70; const fMax = 20;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // KE = hf - phi line (above threshold)
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); let started = false;
    for (let i = 0; i <= pw; i++) { const fi = (i / pw) * fMax; const ke = H_EV * fi * 1e14 - work; const y = oy - Math.max(0, ke) / 4 * ph; if (ke >= 0) { started ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); started = true; } }
    ctx.stroke();
    // threshold marker + current point
    const fx = ox + (freq / fMax) * pw; ctx.strokeStyle = "#a3e635"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(fx, oy); ctx.lineTo(fx, oy - ph); ctx.stroke(); ctx.setLineDash([]);
    if (emits) { ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(fx, oy - KE / 4 * ph, 5, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("max kinetic energy vs frequency", ox + 6, oy - ph + 12); ctx.fillText(`threshold f₀ = ${f0.toFixed(1)}×10¹⁴ Hz`, ox + pw - 150, oy - 6);
  }, [freq, work]);

  const explain = emits
    ? `Each photon carries ${photonE.toFixed(2)} eV, above the ${work} eV work function, so electrons escape with up to ${KE.toFixed(2)} eV — a brighter beam adds more electrons, not more energy per electron.`
    : `Each photon carries only ${photonE.toFixed(2)} eV, below the ${work} eV work function, so no electrons are ejected no matter how intense the light.`;

  const code = `h = 4.1357e-15  # eV*s
freq, work = ${freq}, ${work}
E = h * freq * 1e14
KE = E - work
print('photon', round(E, 3), 'eV')
print('KEmax', round(KE, 3) if KE > 0 else 'no emission')`;

  return (
    <StudioChrome title="Photoelectric Effect" tagline="Einstein's photon"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Light frequency (10¹⁴ Hz)" value={freq} min={1} max={20} step={0.1} onChange={(v) => update({ freq: v })} />
        <Slider label="Work function φ (eV)" value={work} min={1} max={6} step={0.1} onChange={(v) => update({ work: v })} />
        <p className="mt-3 text-xs text-slate-500">Light ejects electrons from a metal only if each photon carries enough energy — no matter how bright a below-threshold beam is. Einstein explained it with KEmax = hf − φ: energy comes in photon packets of hf, and the work function φ is the escape cost. Below the threshold frequency, nothing happens. This won him the Nobel Prize.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Photon energy" value={`${photonE.toFixed(2)} eV`} /><Stat label="Max KE" value={emits ? `${KE.toFixed(2)} eV` : "no emission"} /><Stat label="Stopping voltage" value={emits ? `${KE.toFixed(2)} V` : "—"} /><Stat label="Emission" value={emits ? "yes" : "below threshold"} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
