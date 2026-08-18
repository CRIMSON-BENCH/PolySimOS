"use client";

import { useEffect, useMemo, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 640, H = 440;

const PRESETS: Record<string, { objDensity: number; fluidDensity: number; size: number }> = {
  "Cork (floats high)": { objDensity: 250, fluidDensity: 1000, size: 120 },
  "Ice in water": { objDensity: 900, fluidDensity: 1000, size: 130 },
  "Neutral buoyancy": { objDensity: 1000, fluidDensity: 1000, size: 120 },
  "Sinks (dense)": { objDensity: 1400, fluidDensity: 1000, size: 100 },
};

export function BuoyancyStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ objDensity, fluidDensity, size }, update] = useShareableNumbers({ objDensity: 600, fluidDensity: 1000, size: 120 });

  const submerged = useMemo(() => Math.min(1, objDensity / fluidDensity), [objDensity, fluidDensity]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const waterY = 160;
    ctx.fillStyle = "rgba(34,120,200,0.35)"; ctx.fillRect(0, waterY, W, H - waterY);
    ctx.strokeStyle = "#38bdf8"; ctx.beginPath(); ctx.moveTo(0, waterY); ctx.lineTo(W, waterY); ctx.stroke();
    const bx = W / 2 - size / 2; const sink = submerged >= 1 ? H - waterY - size + 40 : submerged * size; const by = waterY - (size - sink);
    ctx.fillStyle = "#a3e635"; ctx.fillRect(bx, by, size, size);
    ctx.strokeStyle = "#65a30d"; ctx.strokeRect(bx, by, size, size);
    ctx.fillStyle = "#e2e8f0"; ctx.font = "13px system-ui"; ctx.textAlign = "center";
    ctx.fillText(objDensity < fluidDensity ? "floats" : objDensity === fluidDensity ? "neutral" : "sinks", W / 2, by - 10);
    ctx.textAlign = "left"; ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("Archimedes: fraction submerged = ρ_object / ρ_fluid", 14, H - 14);
  }, [objDensity, fluidDensity, size, submerged]);

  const ratio = objDensity / fluidDensity;
  const explain =
    objDensity < fluidDensity
      ? `Lighter than the fluid (ρ ratio ${ratio.toFixed(2)}), so it floats with exactly ${Math.round(submerged * 100)}% submerged — the submerged fraction equals the density ratio, and object size never changes it.`
      : objDensity > fluidDensity
      ? `Denser than the fluid (ρ ratio ${ratio.toFixed(2)}), so buoyant force cannot balance its weight and it sinks — only the density ratio decides this, not how big the block is.`
      : `Densities match exactly, so the block is neutrally buoyant and hovers at any depth — the knife-edge between floating and sinking.`;

  const code = `obj_rho, fluid_rho = ${objDensity}, ${fluidDensity}
frac = min(1.0, obj_rho / fluid_rho)
state = "floats" if obj_rho < fluid_rho else "sinks" if obj_rho > fluid_rho else "neutral"
print("fraction submerged", round(frac, 3), state)`;

  return (
    <StudioChrome title="Buoyancy & Archimedes" tagline="floating equilibrium by density"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">An object floats with exactly the fraction ρ_object/ρ_fluid submerged. Denser than the fluid? It sinks. This is Archimedes&apos; principle, live.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Object density (kg/m³)" value={objDensity} min={100} max={1400} step={50} onChange={(v) => update({ objDensity: v })} />
        <Slider label="Fluid density (kg/m³)" value={fluidDensity} min={500} max={1400} step={50} onChange={(v) => update({ fluidDensity: v })} />
        <Slider label="Object size" value={size} min={60} max={180} step={10} onChange={(v) => update({ size: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Fraction submerged" value={`${Math.round(submerged * 100)}%`} /><Stat label="State" value={objDensity < fluidDensity ? "floats" : objDensity > fluidDensity ? "sinks" : "neutral"} /><Stat label="ρ ratio" value={(objDensity / fluidDensity).toFixed(2)} /><Equation tex={`\\frac{V_{sub}}{V} = \\frac{\\rho_{obj}}{\\rho_{fluid}} = \\frac{${objDensity.toFixed(0)}}{${fluidDensity.toFixed(0)}} = ${submerged.toFixed(2)} \\qquad F_b = \\rho_{fluid}\\,g\\,V`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[460px] rounded-lg" /></StudioChrome>
  );
}
