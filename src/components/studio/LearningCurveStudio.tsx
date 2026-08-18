"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function LearningCurveStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [firstCost, setFirstCost] = useState(100);
  const [rate, setRate] = useState(80); // % learning curve
  const [units, setUnits] = useState(100);

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

  return (
    <StudioChrome title="Learning Curve" tagline="practice makes cheaper"
      controls={<div>
        <Slider label="First unit cost ($)" value={firstCost} min={10} max={1000} step={10} onChange={setFirstCost} />
        <Slider label="Learning rate (%)" value={rate} min={70} max={95} step={1} onChange={setRate} />
        <Slider label="Cumulative units" value={units} min={1} max={200} step={1} onChange={setUnits} />
        <p className="mt-3 text-xs text-slate-500">Every time cumulative production doubles, the cost per unit falls by a fixed percentage — the learning curve. An 80% curve means the 200th unit costs 80% of the 100th. This steady, predictable decline, first seen in aircraft manufacturing, drives the falling prices of everything from solar panels to microchips, and underpins production planning and pricing.</p>
      </div>}
      inspector={<div><Stat label="Cost of unit N" value={`$${nthCost.toFixed(1)}`} /><Stat label="Learning rate" value={`${rate}%`} /><Stat label="Cost reduction" value={`${savings.toFixed(0)}%`} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
