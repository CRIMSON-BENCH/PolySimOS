"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { wE: number; wO: number; wP: number }> = {
  "All three equal": { wE: 1, wO: 1, wP: 1 },
  "Obliquity world (41 kyr)": { wE: 0.2, wO: 2, wP: 0.2 },
  "Precession-driven (23 kyr)": { wE: 0.2, wO: 0.2, wP: 2 },
  "Eccentricity-paced (100 kyr)": { wE: 2, wO: 0.2, wP: 0.2 },
};

// Milankovitch cycles: eccentricity (~100kyr), obliquity (~41kyr), precession (~23kyr).
export function MilankovitchStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ wE, wO, wP }, update] = useShareableNumbers({ wE: 1, wO: 1, wP: 1 });

  useEffect(() => {
    const W = 540, H = 400; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const kyr = 800; const ecc = (t: number) => Math.sin(2 * Math.PI * t / 100) * 0.5 + Math.sin(2 * Math.PI * t / 413) * 0.5;
    const obl = (t: number) => Math.sin(2 * Math.PI * t / 41);
    const pre = (t: number) => Math.sin(2 * Math.PI * t / 23) * Math.cos(2 * Math.PI * t / 19);
    const rows = [["Eccentricity (~100 kyr)", ecc, "#22d3ee", 60], ["Obliquity (~41 kyr)", obl, "#a3e635", 140], ["Precession (~23 kyr)", pre, "#fbbf24", 220]] as const;
    rows.forEach(([label, fn, col, y0]) => { ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); for (let px = 0; px < W - 40; px++) { const t = (px / (W - 40)) * kyr; const y = y0 - fn(t) * 26; px ? ctx.lineTo(px + 30, y) : ctx.moveTo(px + 30, y); } ctx.stroke(); ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(label, 32, y0 - 34); });
    // combined insolation
    const y0 = 330; ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath();
    for (let px = 0; px < W - 40; px++) { const t = (px / (W - 40)) * kyr; const ins = wE * ecc(t) * 0.5 + wO * obl(t) + wP * pre(t) * 0.7; const y = y0 - ins * 22; px ? ctx.lineTo(px + 30, y) : ctx.moveTo(px + 30, y); } ctx.stroke();
    ctx.fillStyle = "#f9a8d4"; ctx.font = "12px sans-serif"; ctx.fillText("Summer insolation at 65°N (drives ice ages)", 32, y0 - 34);
    ctx.fillStyle = "#64748b"; ctx.fillText("0", 30, H - 6); ctx.fillText("800 kyr ago →", W - 110, H - 6);
  }, [wE, wO, wP]);

  // Effective amplitudes (match the weighting used in the combined trace).
  const aE = wE * 0.5, aO = wO, aP = wP * 0.7;
  const dominant = aE >= aO && aE >= aP ? "eccentricity" : aO >= aP ? "obliquity" : "precession";
  const explain =
    dominant === "eccentricity"
      ? "With eccentricity weighted highest, the combined insolation is paced mainly by the ~100 kyr stretch of Earth's orbit — the rhythm that dominates the last million years of ice ages."
      : dominant === "obliquity"
      ? "With obliquity weighted highest, a ~41 kyr beat dominates — the pattern that paced glacial cycles before ~1 million years ago, when axial tilt led the forcing."
      : "With precession weighted highest, the fast ~23 kyr wobble dominates — this term is strongest in the tropics and is modulated by eccentricity's envelope.";

  const code = `import numpy as np
wE, wO, wP = ${wE}, ${wO}, ${wP}
t = np.linspace(0, 800, 2000)  # kyr before present
ecc = 0.5*np.sin(2*np.pi*t/100) + 0.5*np.sin(2*np.pi*t/413)
obl = np.sin(2*np.pi*t/41)
pre = np.sin(2*np.pi*t/23) * np.cos(2*np.pi*t/19)
insolation = wE*ecc*0.5 + wO*obl + wP*pre*0.7
print("insolation range:", insolation.min(), insolation.max())`;

  return (
    <StudioChrome title="Milankovitch Cycles" tagline="orbital forcing of the ice ages"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Eccentricity weight" value={wE} min={0} max={2} step={0.1} onChange={(val) => update({ wE: val })} />
        <Slider label="Obliquity weight" value={wO} min={0} max={2} step={0.1} onChange={(val) => update({ wO: val })} />
        <Slider label="Precession weight" value={wP} min={0} max={2} step={0.1} onChange={(val) => update({ wP: val })} />
        <p className="mt-3 text-xs text-slate-500">Three slow changes in Earth&apos;s orbit — the stretch of its ellipse (eccentricity), the tilt of its axis (obliquity), and the wobble of that axis (precession) — combine to modulate summer sunlight at high latitudes. That insolation rhythm paces the glacial-interglacial cycles recorded in ice and ocean cores.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Eccentricity" value="~100 kyr" /><Stat label="Obliquity" value="~41 kyr" /><Stat label="Precession" value="~23 kyr" /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={400} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
