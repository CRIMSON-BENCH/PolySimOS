"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

function normCDF(x: number) { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const d = 0.3989423 * Math.exp(-x * x / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; }

const PRESETS: Record<string, { mean: number; sigma: number; specWidth: number }> = {
  "Six Sigma": { mean: 50, sigma: 0.6, specWidth: 8 },
  "Capable (centered)": { mean: 50, sigma: 0.9, specWidth: 8 },
  "Off-center drift": { mean: 52, sigma: 1, specWidth: 8 },
  "Not capable": { mean: 50, sigma: 2.5, specWidth: 6 },
};

export function ProcessCapabilityStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ mean, sigma, specWidth }, update] = useShareableNumbers({ mean: 50, sigma: 1, specWidth: 6 });

  const LSL = 50 - specWidth / 2, USL = 50 + specWidth / 2;
  const Cp = (USL - LSL) / (6 * sigma); const Cpk = Math.min((USL - mean) / (3 * sigma), (mean - LSL) / (3 * sigma));
  const defectPPM = (normCDF((LSL - mean) / sigma) + (1 - normCDF((USL - mean) / sigma))) * 1e6;
  const sigmaLevel = Cpk * 3 + 1.5;

  useEffect(() => {
    const W = 520, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 20, oy = H - 40, pw = W - 40, ph = H - 70; const lo = 44, hi = 56;
    const X = (v: number) => ox + ((v - lo) / (hi - lo)) * pw;
    // spec limits
    ctx.fillStyle = "rgba(239,68,68,0.12)"; ctx.fillRect(ox, 10, X(LSL) - ox, oy - 10); ctx.fillRect(X(USL), 10, ox + pw - X(USL), oy - 10);
    ctx.strokeStyle = "#ef4444"; ctx.setLineDash([4, 4]); [LSL, USL].forEach((v) => { ctx.beginPath(); ctx.moveTo(X(v), 10); ctx.lineTo(X(v), oy); ctx.stroke(); }); ctx.setLineDash([]);
    // distribution
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const v = lo + (i / pw) * (hi - lo); const y = oy - Math.exp(-((v - mean) ** 2) / (2 * sigma * sigma)) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#fca5a5"; ctx.font = "11px sans-serif"; ctx.fillText("LSL", X(LSL) - 12, oy + 14); ctx.fillText("USL", X(USL) - 12, oy + 14); ctx.fillStyle = "#94a3b8"; ctx.fillText("process distribution vs specification limits", ox + 6, 22);
  }, [mean, sigma, specWidth]);

  const verdict = Cpk >= 2 ? "six sigma" : Cpk >= 1.33 ? "capable" : Cpk >= 1 ? "marginal" : "not capable";

  const explain =
    Cpk < 1
      ? `Cpk ${Cpk.toFixed(2)} is below 1: the process spread spills past the spec limits, so expect about ${defectPPM.toFixed(0)} defects per million.`
      : Math.abs(mean - 50) > sigma
      ? `The spread fits the tolerance (Cp ${Cp.toFixed(2)}), but the mean is off-center, so Cpk ${Cpk.toFixed(2)} trails Cp and defects pile up on the near limit.`
      : Cpk >= 2
      ? `Well-centered and tight: Cpk ${Cpk.toFixed(2)} clears the Six Sigma bar with only a handful of defects per million.`
      : `Centered and capable at Cpk ${Cpk.toFixed(2)}, comfortably above the 1.33 industry bar.`;

  const code = `import numpy as np
from scipy.stats import norm
mean, sigma, spec_width = ${mean}, ${sigma}, ${specWidth}
LSL, USL = 50 - spec_width / 2, 50 + spec_width / 2
Cp = (USL - LSL) / (6 * sigma)
Cpk = min((USL - mean) / (3 * sigma), (mean - LSL) / (3 * sigma))
ppm = (norm.cdf((LSL - mean) / sigma) + 1 - norm.cdf((USL - mean) / sigma)) * 1e6
print("Cp", round(Cp, 3), "Cpk", round(Cpk, 3), "ppm", round(ppm))`;

  return (
    <StudioChrome title="Process Capability (Cp / Cpk)" tagline="how good is the process?"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Process mean" value={mean} min={46} max={54} step={0.1} onChange={(v) => update({ mean: v })} />
        <Slider label="Process σ" value={sigma} min={0.3} max={3} step={0.1} onChange={(v) => update({ sigma: v })} />
        <Slider label="Spec width (USL−LSL)" value={specWidth} min={2} max={12} step={0.5} onChange={(v) => update({ specWidth: v })} />
        <p className="mt-3 text-xs text-slate-500">Cp compares the spec width to the process spread — can the process fit inside the tolerances at all? Cpk also accounts for how well-centered it is. A Cpk of 1.33 is the usual bar for capable; 2.0 is Six Sigma quality with just 3.4 defects per million. Widen the spread or push the mean off-center and defects climb fast.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Cp" value={Cp.toFixed(2)} /><Stat label="Cpk" value={Cpk.toFixed(2)} /><Stat label="Defects" value={`${defectPPM.toFixed(0)} ppm`} /><Stat label="Rating" value={verdict} /><Stat label="Sigma level" value={`${sigmaLevel.toFixed(1)}σ`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
