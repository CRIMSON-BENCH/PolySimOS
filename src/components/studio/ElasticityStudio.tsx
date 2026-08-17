"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Linear demand P = a - bQ; point elasticity + revenue.
export function ElasticityStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [price, setPrice] = useState(50);
  const a = 100, b = 1; // Q = (a - P)/b
  const Q = Math.max(0, (a - price) / b); const elasticity = Q > 0 ? -(1 / b) * (price / Q) : -Infinity;
  const revenue = price * Q; const kind = Math.abs(elasticity) > 1 ? "elastic" : Math.abs(elasticity) < 1 ? "inelastic" : "unit";

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 500, H = 340; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const qMax = 100, pMax = 110;
    const X = (q: number) => ox + (q / qMax) * pw; const Y = (p: number) => oy - (p / pMax) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // demand line, colored by elasticity region (midpoint = unit)
    ctx.lineWidth = 3; for (let i = 0; i < pw; i++) { const q = (i / pw) * qMax; const p = a - b * q; if (p < 0) break; const el = -(price / q) / b; ctx.strokeStyle = q < a / 2 ? "#22d3ee" : "#f472b6"; ctx.beginPath(); ctx.moveTo(X(q), Y(p)); ctx.lineTo(X((i + 1) / pw * qMax), Y(a - b * (i + 1) / pw * qMax)); ctx.stroke(); void el; }
    // revenue rectangle
    ctx.fillStyle = "rgba(163,230,53,0.15)"; ctx.fillRect(X(0), Y(price), X(Q) - X(0), oy - Y(price));
    ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(X(Q), Y(price), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("elastic (cyan)", ox + 6, oy - ph + 14); ctx.fillStyle = "#f9a8d4"; ctx.fillText("inelastic (pink)", ox + 90, oy - ph + 14); ctx.fillStyle = "#94a3b8"; ctx.fillText("Q →", ox + pw - 30, oy + 18);
  }, [price]);

  return (
    <StudioChrome title="Price Elasticity of Demand" tagline="how sensitive is quantity?"
      controls={<div>
        <Slider label="Price" value={price} min={5} max={95} step={1} onChange={setPrice} />
        <p className="mt-3 text-xs text-slate-500">Elasticity measures how much quantity demanded responds to price. Where demand is elastic (|E| &gt; 1), a price cut raises total revenue; where it is inelastic, a price cut lowers revenue. On a straight-line demand curve the top half is elastic, the bottom half inelastic, and revenue peaks exactly at the midpoint where elasticity equals one.</p>
      </div>}
      inspector={<div><Stat label="Quantity" value={Q.toFixed(1)} /><Stat label="Elasticity" value={isFinite(elasticity) ? elasticity.toFixed(2) : "−∞"} /><Stat label="Type" value={kind} /><Stat label="Revenue" value={`$${revenue.toFixed(0)}`} /></div>}
    ><canvas ref={canvasRef} width={500} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
