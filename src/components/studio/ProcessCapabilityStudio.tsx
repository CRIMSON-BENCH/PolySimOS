"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

function normCDF(x: number) { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const d = 0.3989423 * Math.exp(-x * x / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; }

export function ProcessCapabilityStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mean, setMean] = useState(50);
  const [sigma, setSigma] = useState(1);
  const [specWidth, setSpecWidth] = useState(6);

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
  return (
    <StudioChrome title="Process Capability (Cp / Cpk)" tagline="how good is the process?"
      controls={<div>
        <Slider label="Process mean" value={mean} min={46} max={54} step={0.1} onChange={setMean} />
        <Slider label="Process σ" value={sigma} min={0.3} max={3} step={0.1} onChange={setSigma} />
        <Slider label="Spec width (USL−LSL)" value={specWidth} min={2} max={12} step={0.5} onChange={setSpecWidth} />
        <p className="mt-3 text-xs text-slate-500">Cp compares the spec width to the process spread — can the process fit inside the tolerances at all? Cpk also accounts for how well-centered it is. A Cpk of 1.33 is the usual bar for capable; 2.0 is Six Sigma quality with just 3.4 defects per million. Widen the spread or push the mean off-center and defects climb fast.</p>
      </div>}
      inspector={<div><Stat label="Cp" value={Cp.toFixed(2)} /><Stat label="Cpk" value={Cpk.toFixed(2)} /><Stat label="Defects" value={`${defectPPM.toFixed(0)} ppm`} /><Stat label="Rating" value={verdict} /><Stat label="Sigma level" value={`${sigmaLevel.toFixed(1)}σ`} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
