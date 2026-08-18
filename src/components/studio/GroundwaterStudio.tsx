"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { Q: number; T: number; R: number }> = {
  "Deep cone (tight aquifer)": { Q: 3000, T: 100, R: 500 },
  "Flat cone (high T)": { Q: 3000, T: 2000, R: 500 },
  "Heavy municipal pumping": { Q: 8000, T: 500, R: 800 },
  "Wide radius of influence": { Q: 2000, T: 500, R: 1500 },
};

// Thiem steady-state drawdown cone: s(r) = Q/(2*pi*T) * ln(R/r)
export function GroundwaterStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ Q, T, R }, update] = useShareableNumbers({ Q: 2000, T: 500, R: 500 });

  const drawdownAt = (r: number) => r >= R ? 0 : Math.max(0, (Q / (2 * Math.PI * T)) * Math.log(R / Math.max(r, 0.3)));
  const sWell = drawdownAt(0.3);

  useEffect(() => {
    const W = 540, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2; const surfaceY = 40; const waterY0 = 110; const scaleR = (W / 2 - 20) / R; const scaleS = 8;
    // aquifer fill
    ctx.fillStyle = "#1e3a5f"; ctx.fillRect(0, waterY0, W, H - waterY0);
    // drawdown cone (water table)
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let px = 0; px <= W; px += 2) { const r = Math.abs(px - cx) / scaleR; const y = waterY0 + drawdownAt(r) * scaleS; px ? ctx.lineTo(px, y) : ctx.moveTo(px, y); } ctx.stroke();
    ctx.fillStyle = "rgba(34,211,238,0.12)"; ctx.beginPath(); ctx.moveTo(0, H); for (let px = 0; px <= W; px += 2) { const r = Math.abs(px - cx) / scaleR; ctx.lineTo(px, waterY0 + drawdownAt(r) * scaleS); } ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    // ground
    ctx.fillStyle = "#44403c"; ctx.fillRect(0, surfaceY, W, waterY0 - surfaceY);
    ctx.strokeStyle = "#78716c"; ctx.beginPath(); ctx.moveTo(0, surfaceY); ctx.lineTo(W, surfaceY); ctx.stroke();
    // well
    ctx.fillStyle = "#e2e8f0"; ctx.fillRect(cx - 4, surfaceY - 10, 8, H - surfaceY); ctx.fillStyle = "#0b1220"; ctx.fillRect(cx - 2, surfaceY, 4, H - surfaceY);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("pumping well", cx + 8, surfaceY + 4); ctx.fillText("original water table", 10, waterY0 - 6); ctx.fillText("drawdown cone", cx + 60, waterY0 + 40);
  }, [Q, T, R]);

  const explain =
    T <= 150
      ? "Low transmissivity: the aquifer can barely move water sideways, so the cone plunges steeply and drawdown at the well is severe."
      : T >= 1500
      ? "High transmissivity spreads the pumping stress far and wide, so the cone is broad and shallow — little drawdown even close to the well."
      : Q >= 6000
      ? "Heavy pumping: doubling Q doubles drawdown everywhere, so this rate carves a deep cone that may de-water shallower nearby wells."
      : `Drawdown is Q/(2πT)·ln(R/r): here it is about ${sWell.toFixed(1)} m at the well and falls off logarithmically, so most of the depression sits in the first tens of metres.`;

  const code = `import numpy as np
Q, T, R = ${Q}, ${T}, ${R}  # m^3/day, m^2/day, m
s = lambda r: 0.0 if r >= R else Q/(2*np.pi*T)*np.log(R/max(r, 0.3))
print("drawdown at well", round(s(0.3), 2), "m")
print("drawdown at 50 m", round(s(50), 3), "m")`;

  return (
    <StudioChrome title="Groundwater Well Drawdown" tagline="Thiem steady-state cone of depression"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Pumping rate Q (m³/day)" value={Q} min={100} max={8000} step={100} onChange={(v) => update({ Q: v })} />
        <Slider label="Transmissivity T (m²/day)" value={T} min={50} max={2000} step={50} onChange={(v) => update({ T: v })} />
        <Slider label="Radius of influence R (m)" value={R} min={100} max={1500} step={50} onChange={(v) => update({ R: v })} />
        <p className="mt-3 text-xs text-slate-500">Pumping a well lowers the water table into a cone of depression. Under the Thiem steady-state solution the drawdown is s(r) = Q/(2πT)·ln(R/r): more pumping deepens the cone, higher transmissivity flattens it. Fundamental to well design, water supply, and contaminant capture.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Drawdown at well" value={`${sWell.toFixed(1)} m`} />
        <Stat label="Drawdown at 50 m" value={`${drawdownAt(50).toFixed(2)} m`} />
        <Stat label="Radius of influence" value={`${R} m`} />
        <Equation tex={`s(r) = \\frac{Q}{2\\pi T}\\ln\\frac{R}{r} = \\frac{${Q}}{2\\pi\\cdot${T}}\\ln\\frac{${R}}{r}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={540} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
