"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 640, H = 440;

export function BuoyancyStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [objDensity, setObjDensity] = useState(600);
  const [fluidDensity, setFluidDensity] = useState(1000);
  const [size, setSize] = useState(120);

  const submerged = useMemo(() => Math.min(1, objDensity / fluidDensity), [objDensity, fluidDensity]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
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

  return (
    <StudioChrome title="Buoyancy & Archimedes" tagline="floating equilibrium by density"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">An object floats with exactly the fraction ρ_object/ρ_fluid submerged. Denser than the fluid? It sinks. This is Archimedes&apos; principle, live.</p>
        <Slider label="Object density (kg/m³)" value={objDensity} min={100} max={1400} step={50} onChange={setObjDensity} />
        <Slider label="Fluid density (kg/m³)" value={fluidDensity} min={500} max={1400} step={50} onChange={setFluidDensity} />
        <Slider label="Object size" value={size} min={60} max={180} step={10} onChange={setSize} />
      </div>}
      inspector={<div><Stat label="Fraction submerged" value={`${Math.round(submerged * 100)}%`} /><Stat label="State" value={objDensity < fluidDensity ? "floats" : objDensity > fluidDensity ? "sinks" : "neutral"} /><Stat label="ρ ratio" value={(objDensity / fluidDensity).toFixed(2)} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[460px] rounded-lg" /></StudioChrome>
  );
}
