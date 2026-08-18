"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Reinforced concrete beam flexural capacity (Whitney stress block, ACI).
export function ConcreteBeamStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [b, setB] = useState(300); // mm
  const [d, setD] = useState(500); // mm effective depth
  const [As, setAs] = useState(1500); // mm^2 steel area
  const [fc, setFc] = useState(30); // MPa
  const [fy, setFy] = useState(420); // MPa

  const a = As * fy / (0.85 * fc * b); // mm depth of stress block
  const Mn = As * fy * (d - a / 2) / 1e6; // kN·m
  const phiMn = 0.9 * Mn;
  const rho = As / (b * d);
  const beta1 = fc <= 28 ? 0.85 : Math.max(0.65, 0.85 - 0.05 * (fc - 28) / 7);
  const rhoBal = 0.85 * beta1 * (fc / fy) * (600 / (600 + fy));
  const tension = rho < 0.75 * rhoBal;

  useEffect(() => {
    const W = 340, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const scale = 220 / Math.max(d + 60, b); const ox = W / 2 - b * scale / 2, oy = 40; const bh = (d + 60) * scale;
    ctx.fillStyle = "#475569"; ctx.fillRect(ox, oy, b * scale, bh); ctx.strokeStyle = "#94a3b8"; ctx.strokeRect(ox, oy, b * scale, bh);
    // compression block
    ctx.fillStyle = "rgba(34,211,238,0.4)"; ctx.fillRect(ox, oy, b * scale, a * scale); ctx.strokeStyle = "#22d3ee"; ctx.strokeRect(ox, oy, b * scale, a * scale);
    // rebar
    const nBar = 4; ctx.fillStyle = "#f472b6"; for (let i = 0; i < nBar; i++) { const x = ox + (b * scale) * (i + 1) / (nBar + 1); ctx.beginPath(); ctx.arc(x, oy + d * scale, 6, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#e2e8f0"; ctx.font = "11px sans-serif"; ctx.fillText("compression block a", ox + 4, oy + a * scale + 14); ctx.fillText("tension steel", ox + 4, oy + d * scale + 22); ctx.fillText(`b = ${b}`, ox + b * scale / 2 - 16, oy - 8);
  }, [b, d, As, fc, fy]);

  return (
    <StudioChrome title="Reinforced Concrete Beam" tagline="flexural capacity (ACI)"
      controls={<div>
        <Slider label="Width b (mm)" value={b} min={200} max={600} step={10} onChange={setB} />
        <Slider label="Effective depth d (mm)" value={d} min={300} max={900} step={10} onChange={setD} />
        <Slider label="Steel area As (mm²)" value={As} min={500} max={4000} step={100} onChange={setAs} />
        <Slider label="Concrete f'c (MPa)" value={fc} min={20} max={50} step={1} onChange={setFc} />
        <Slider label="Steel fy (MPa)" value={fy} min={300} max={550} step={10} onChange={setFy} />
        <p className="mt-3 text-xs text-slate-500">A reinforced concrete beam resists bending through a compression block in the concrete and tension in the steel. Setting these forces equal gives the stress-block depth a, and the moment capacity Mn = As·fy·(d − a/2). A tension-controlled section (steel yields first) fails gradually — the ductile behavior codes require. Educational tool, not a design.</p>
      </div>}
      inspector={<div><Stat label="Stress block a" value={`${a.toFixed(0)} mm`} /><Stat label="Nominal Mn" value={`${Mn.toFixed(0)} kN·m`} /><Stat label="Design φMn" value={`${phiMn.toFixed(0)} kN·m`} /><Stat label="Behavior" value={tension ? "tension-controlled" : "check ductility"} /></div>}
    ><canvas ref={canvasRef} width={340} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
