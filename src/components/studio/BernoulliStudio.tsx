"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function BernoulliStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [v1, setV1] = useState(2), [a1, setA1] = useState(0.05), [a2, setA2] = useState(0.02), [rho, setRho] = useState(1000);
  const v2 = v1 * a1 / a2;
  const p0 = 100000;
  const p2rel = 0.5 * rho * (v1 * v1 - v2 * v2);

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cy = H / 2, r1 = Math.min(70, a1 * 900), r2 = Math.min(70, a2 * 900);
    ctx.fillStyle = "#0e7490";
    ctx.beginPath(); ctx.moveTo(30, cy - r1); ctx.lineTo(200, cy - r1); ctx.lineTo(300, cy - r2); ctx.lineTo(W - 30, cy - r2); ctx.lineTo(W - 30, cy + r2); ctx.lineTo(300, cy + r2); ctx.lineTo(200, cy + r1); ctx.lineTo(30, cy + r1); ctx.closePath(); ctx.fill();
    // streamlines with speed → color
    for (let s = -2; s <= 2; s++) { ctx.strokeStyle = "#67e8f9"; ctx.globalAlpha = 0.6; ctx.beginPath(); const yo = s * 14; ctx.moveTo(40, cy + yo * (r1 / 30)); ctx.lineTo(200, cy + yo * (r1 / 30)); ctx.lineTo(300, cy + yo * (r2 / 30)); ctx.lineTo(W - 40, cy + yo * (r2 / 30)); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("wide & slow (high pressure)", 40, cy - r1 - 10); ctx.fillText("narrow & fast (low pressure)", 320, cy - r2 - 10);
  }, [v1, a1, a2, rho]);

  return (
    <StudioChrome title="Bernoulli / Venturi" tagline="faster flow, lower pressure"
      controls={<div>
        <Slider label="Inlet velocity (m/s)" value={v1} min={0.5} max={8} step={0.5} onChange={setV1} />
        <Slider label="Inlet area (m²)" value={a1} min={0.02} max={0.08} step={0.005} onChange={setA1} />
        <Slider label="Throat area (m²)" value={a2} min={0.005} max={0.05} step={0.005} onChange={setA2} />
        <Slider label="Fluid density (kg/m³)" value={rho} min={1} max={1200} step={1} onChange={setRho} />
        <p className="mt-3 text-xs text-slate-500">Bernoulli’s principle: along a streamline, p + ½ρv² is constant. Squeeze the flow through a narrow throat and it speeds up (continuity), so its pressure drops. This is how carburetors, atomizers, and airplane wings work. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Throat velocity" value={`${v2.toFixed(2)} m/s`} />
        <Stat label="Pressure change" value={`${(p2rel / 1000).toFixed(2)} kPa`} />
        <Stat label="Throat pressure" value={`${((p0 + p2rel) / 1000).toFixed(1)} kPa`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
