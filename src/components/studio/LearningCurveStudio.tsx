"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { firstCost: number; rate: number; units: number }> = {
  "Aerospace 80%": { firstCost: 100, rate: 80, units: 100 },
  "Steep 70%": { firstCost: 100, rate: 70, units: 128 },
  "Shallow 92%": { firstCost: 200, rate: 92, units: 100 },
  "Solar scale": { firstCost: 500, rate: 78, units: 200 },
};

export function LearningCurveStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ firstCost, rate, units }, update] = useShareableNumbers({ firstCost: 100, rate: 80, units: 100 });

  const b = Math.log(rate / 100) / Math.log(2);
  const unitCost = (n: number) => firstCost * Math.pow(n, b);
  const nthCost = unitCost(units); const savings = (1 - nthCost / firstCost) * 100;

  useEffect(() => {
    const W = 520, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const nMax = 200;
    const X = (n: number) => ox + (n / nMax) * pw; const Y = (c: number) => oy - (c / firstCost) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let n = 1; n <= nMax; n++) { const y = Y(unitCost(n)); n === 1 ? ctx.moveTo(X(n), y) : ctx.lineTo(X(n), y); } ctx.stroke();
    // doubling markers
    ctx.fillStyle = "#64748b"; ctx.font = "9px sans-serif"; [1, 2, 4, 8, 16, 32, 64, 128].forEach((n) => { if (n <= nMax) { ctx.fillStyle = "#1e293b"; ctx.fillRect(X(n), oy - ph, 1, ph); } });
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(X(units), Y(nthCost), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("unit cost vs cumulative units built", ox + 6, oy - ph + 12); ctx.fillText("units →", ox + pw - 50, oy + 16);
  }, [firstCost, rate, units]);

  const explain = `An ${rate}% curve means every doubling of output trims ${(100 - rate).toFixed(0)}% off the unit cost — so by unit ${units} you are paying about $${nthCost.toFixed(0)}, a ${savings.toFixed(0)}% drop from the first unit. Lower rates bend the curve down faster.`;
  const code = `import numpy as np
first_cost, rate, units = ${firstCost}, ${rate}, ${units}
b = np.log(rate / 100) / np.log(2)
nth = first_cost * units ** b
print("unit", units, "cost", nth, "reduction_pct", (1 - nth / first_cost) * 100)`;
  return (
    <StudioChrome title="Learning Curve" tagline="practice makes cheaper"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="First unit cost ($)" value={firstCost} min={10} max={1000} step={10} onChange={(v) => update({ firstCost: v })} />
        <Slider label="Learning rate (%)" value={rate} min={70} max={95} step={1} onChange={(v) => update({ rate: v })} />
        <Slider label="Cumulative units" value={units} min={1} max={200} step={1} onChange={(v) => update({ units: v })} />
        <p className="mt-3 text-xs text-slate-500">Every time cumulative production doubles, the cost per unit falls by a fixed percentage — the learning curve. An 80% curve means the 200th unit costs 80% of the 100th. This steady, predictable decline, first seen in aircraft manufacturing, drives the falling prices of everything from solar panels to microchips, and underpins production planning and pricing.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Cost of unit N" value={`$${nthCost.toFixed(1)}`} /><Stat label="Learning rate" value={`${rate}%`} /><Stat label="Cost reduction" value={`${savings.toFixed(0)}%`} /><Equation tex={`C_n = C_1\\,n^{-b},\\quad b = -\\log_2(${(rate / 100).toFixed(2)}) = ${(-b).toFixed(3)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
