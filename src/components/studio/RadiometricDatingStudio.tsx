"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const ISO: Record<string, { hl: number; unit: string; use: string }> = {
  "Carbon-14": { hl: 5730, unit: "yr", use: "organic remains < 50k yr" },
  "Potassium-40": { hl: 1.25e9, unit: "yr", use: "volcanic rock, million-yr" },
  "Uranium-238": { hl: 4.47e9, unit: "yr", use: "oldest rocks, Earth age" },
};

const PRESETS: Record<string, { fraction: number }> = {
  "Fresh (0.9)": { fraction: 0.9 },
  "1 half-life (0.5)": { fraction: 0.5 },
  "2 half-lives (0.25)": { fraction: 0.25 },
  "Ancient (0.1)": { fraction: 0.1 },
};

export function RadiometricDatingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [iso, setIso] = useState("Carbon-14");
  const [{ fraction }, update] = useShareableNumbers({ fraction: 0.5 }); // remaining fraction

  const hl = ISO[iso].hl; const age = hl * Math.log(1 / fraction) / Math.log(2);

  useEffect(() => {
    const W = 500, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const t = (i / pw) * 5; const f = Math.pow(0.5, t); const y = oy - f * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    // half-life markers
    for (let h = 1; h <= 4; h++) { const x = ox + (h / 5) * pw; ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, oy - ph); ctx.stroke(); ctx.fillStyle = "#64748b"; ctx.font = "9px sans-serif"; ctx.fillText(`${h} HL`, x - 8, oy + 12); }
    const hlElapsed = Math.log(1 / fraction) / Math.log(2); const px = ox + (hlElapsed / 5) * pw; const py = oy - fraction * ph;
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(Math.min(px, ox + pw), py, 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("remaining isotope fraction vs half-lives", ox + 6, oy - ph + 12);
  }, [iso, fraction]);

  const ageStr = age > 1e6 ? `${(age / 1e6).toFixed(2)} million yr` : age > 1e3 ? `${(age / 1e3).toFixed(1)} thousand yr` : `${age.toFixed(0)} yr`;

  const explain =
    fraction >= 0.85
      ? `Most of the ${iso} is still present, so only a small slice of a half-life has passed — the estimated age is young relative to this clock.`
      : fraction <= 0.15
      ? `Very little ${iso} remains, so several half-lives have elapsed — the sample sits near the far, uncertain end of this method’s range.`
      : `About ${(fraction * 100).toFixed(0)}% of the ${iso} is left, which maps to roughly ${(Math.log(1 / fraction) / Math.log(2)).toFixed(1)} half-lives of elapsed time.`;

  const code = `import numpy as np
half_life = ${hl}  # ${iso}, ${ISO[iso].unit}
fraction = ${fraction}
age = half_life * np.log(1 / fraction) / np.log(2)
print("estimated age:", age, "${ISO[iso].unit}")`;

  return (
    <StudioChrome title="Radiometric Dating" tagline="reading the atomic clock"
      controls={<div>
        <div className="mb-3 grid gap-2">{Object.keys(ISO).map((k) => <button key={k} onClick={() => setIso(k)} className={`rounded-lg px-2 py-1.5 text-xs font-semibold ${iso === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{k}</button>)}</div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Remaining fraction" value={fraction} min={0.01} max={0.99} step={0.01} onChange={(v) => update({ fraction: v })} />
        <p className="mt-3 text-xs text-slate-500">Radioactive isotopes decay at a fixed half-life, so the fraction remaining in a sample is a clock. Measure it and you can read the age: t = half-life × log₂(1/fraction). Carbon-14 dates organic material up to ~50,000 years; uranium-238, with a 4.5-billion-year half-life, dates the oldest rocks and the age of the Earth itself.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Half-life" value={`${hl.toExponential(2)} ${ISO[iso].unit}`} /><Stat label="Estimated age" value={ageStr} /><Stat label="Best for" value={ISO[iso].use} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
