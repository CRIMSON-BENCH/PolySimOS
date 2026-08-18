"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function SupplyDemandStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [demShift, setDemShift] = useState(0);
  const [supShift, setSupShift] = useState(0);
  const [tax, setTax] = useState(0);

  // demand P = 100 - Q + demShift ; supply P = 20 + Q + supShift + tax
  const a = 100 + demShift, b = 1; const c = 20 + supShift + tax, d = 1;
  const qStar = (a - c) / (b + d); const pStar = a - b * qStar;
  const cs = 0.5 * (a - pStar) * qStar; const ps = 0.5 * (pStar - (c)) * qStar;

  useEffect(() => {
    const W = 500, H = 360; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const qMax = 90, pMax = 120;
    const X = (q: number) => ox + (q / qMax) * pw; const Y = (p: number) => oy - (p / pMax) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // surplus shading
    ctx.fillStyle = "rgba(34,211,238,0.12)"; ctx.beginPath(); ctx.moveTo(X(0), Y(a)); ctx.lineTo(X(qStar), Y(pStar)); ctx.lineTo(X(0), Y(pStar)); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(163,230,53,0.12)"; ctx.beginPath(); ctx.moveTo(X(0), Y(c)); ctx.lineTo(X(qStar), Y(pStar)); ctx.lineTo(X(0), Y(pStar)); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(0), Y(a)); ctx.lineTo(X(qMax), Y(a - b * qMax)); ctx.stroke();
    ctx.strokeStyle = "#f472b6"; ctx.beginPath(); ctx.moveTo(X(0), Y(c)); ctx.lineTo(X(qMax), Y(c + d * qMax)); ctx.stroke();
    ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(X(qStar), Y(pStar), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("demand", X(qMax) - 50, Y(a - b * qMax) - 6); ctx.fillText("supply", X(qMax) - 46, Y(c + d * qMax) - 6); ctx.fillText("Q →", ox + pw - 30, oy + 18);
  }, [demShift, supShift, tax]);

  return (
    <StudioChrome title="Supply & Demand" tagline="market equilibrium & surplus"
      controls={<div>
        <Slider label="Demand shift" value={demShift} min={-40} max={40} step={2} onChange={setDemShift} />
        <Slider label="Supply shift" value={supShift} min={-15} max={40} step={2} onChange={setSupShift} />
        <Slider label="Per-unit tax" value={tax} min={0} max={40} step={2} onChange={setTax} />
        <p className="mt-3 text-xs text-slate-500">Where the downward demand curve crosses the upward supply curve, the market clears: that price and quantity are the equilibrium. Shifting either curve moves it. The shaded triangles are consumer and producer surplus — the total gains from trade. A per-unit tax lifts the supply curve, raising price, cutting quantity, and creating deadweight loss.</p>
      </div>}
      inspector={<div><Stat label="Equilibrium price" value={`$${pStar.toFixed(1)}`} /><Stat label="Equilibrium qty" value={qStar.toFixed(1)} /><Stat label="Consumer surplus" value={cs.toFixed(0)} /><Stat label="Producer surplus" value={ps.toFixed(0)} /></div>}
    ><canvas ref={canvasRef} width={500} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
