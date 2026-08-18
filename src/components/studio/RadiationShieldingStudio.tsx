"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const MAT: Record<string, number> = { Water: 0.0086, Concrete: 0.022, Aluminum: 0.024, Iron: 0.058, Lead: 0.113 }; // mu (1/mm) for ~1 MeV gamma

const PRESETS: Record<string, { mat: string; thickness: number }> = {
  "Lead brick": { mat: "Lead", thickness: 50 },
  "Concrete wall": { mat: "Concrete", thickness: 150 },
  "Steel drum": { mat: "Iron", thickness: 20 },
  "Water tank": { mat: "Water", thickness: 200 },
};

export function RadiationShieldingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mat, setMat] = useState("Lead");
  const [{ thickness }, update] = useShareableNumbers({ thickness: 30 }); // mm

  const mu = MAT[mat]; const transmitted = Math.exp(-mu * thickness); const hvl = Math.log(2) / mu; const tvl = Math.log(10) / mu;

  const explain =
    transmitted < 0.001
      ? `${thickness} mm of ${mat} blocks over 99.9% of the beam — about ${(thickness / tvl).toFixed(1)} tenth-value layers of attenuation.`
      : transmitted < 0.5
      ? `${mat} cuts the beam to ${(transmitted * 100).toFixed(1)}%; you are past one half-value layer (${hvl.toFixed(1)} mm).`
      : `At ${thickness} mm this ${mat} shield still passes ${(transmitted * 100).toFixed(0)}% — thin, low-density shields do little against penetrating gammas.`;

  const code = `import math
mu = ${mu}  # 1/mm, ${mat} at ~1 MeV gamma
x = ${thickness}  # thickness in mm
transmitted = math.exp(-mu * x)
hvl = math.log(2) / mu   # half-value layer
tvl = math.log(10) / mu  # tenth-value layer
print(f"{transmitted*100:.2f}% through, HVL {hvl:.1f} mm, TVL {tvl:.1f} mm")`;

  useEffect(() => {
    const W = 520, H = 240; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cy = H / 2; // source
    ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(30, cy, 12, 0, 7); ctx.fill();
    // shield
    const sx = 160, sw = Math.max(6, thickness * 2); ctx.fillStyle = "#334155"; ctx.fillRect(sx, 30, sw, H - 60); ctx.strokeStyle = "#64748b"; ctx.strokeRect(sx, 30, sw, H - 60);
    // beam intensity before/after
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 8; ctx.globalAlpha = 1; ctx.beginPath(); ctx.moveTo(42, cy); ctx.lineTo(sx, cy); ctx.stroke();
    ctx.globalAlpha = transmitted; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(sx + sw, cy); ctx.lineTo(W - 20, cy); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("source", 12, cy - 20); ctx.fillText(`${mat} shield`, sx, 24); ctx.fillText(`${(transmitted * 100).toFixed(1)}% through`, W - 130, cy - 14);
  }, [mat, thickness]);

  return (
    <StudioChrome title="Radiation Shielding" tagline="attenuation & half-value layer"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => { setMat(PRESETS[l].mat); update({ thickness: PRESETS[l].thickness }); }} />
        <div className="mb-3 grid grid-cols-3 gap-2">{Object.keys(MAT).map((k) => <button key={k} onClick={() => setMat(k)} className={`rounded-lg px-1 py-1 text-xs font-semibold ${mat === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{k}</button>)}</div>
        <Slider label="Thickness (mm)" value={thickness} min={1} max={200} step={1} onChange={(v) => update({ thickness: v })} />
        <p className="mt-3 text-xs text-slate-500">Gamma rays are not stopped abruptly — they are attenuated exponentially, I = I₀·e^(−μx). The half-value layer is the thickness that cuts intensity in half, and it takes about ten of them to reach 0.1%. Dense, high-atomic-number materials like lead have the largest μ, which is why they make the most compact shields.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Transmitted" value={`${(transmitted * 100).toFixed(2)}%`} /><Stat label="Half-value layer" value={`${hvl.toFixed(1)} mm`} /><Stat label="Tenth-value layer" value={`${tvl.toFixed(1)} mm`} /><Equation tex={`I = I_0\\,e^{-\\mu x} = I_0\\,e^{-${mu}\\cdot ${thickness}} = ${(transmitted * 100).toFixed(1)}\\%\\,I_0,\\quad \\mathrm{HVL} = \\frac{\\ln 2}{\\mu} = ${hvl.toFixed(1)}\\ \\text{mm}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={240} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
