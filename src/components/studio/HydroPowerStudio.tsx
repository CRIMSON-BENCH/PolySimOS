"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function HydroPowerStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [head, setHead] = useState(50); // m
  const [flow, setFlow] = useState(10); // m^3/s
  const [eff, setEff] = useState(85); // %

  const rho = 1000, g = 9.81; const power = rho * g * flow * head * eff / 100; // W
  const annual = power * 8760 * 0.5 / 1e6; // MWh at 50% capacity factor

  useEffect(() => {
    const W = 460, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const damX = 200; const topY = 40, botY = H - 40; const hpx = Math.min(botY - topY, head * 2.5);
    // reservoir
    ctx.fillStyle = "#1e3a5f"; ctx.fillRect(20, botY - hpx, damX - 20, hpx);
    // dam
    ctx.fillStyle = "#475569"; ctx.beginPath(); ctx.moveTo(damX, botY); ctx.lineTo(damX + 30, botY); ctx.lineTo(damX + 15, botY - hpx - 10); ctx.lineTo(damX, botY - hpx - 10); ctx.fill();
    // penstock + turbine
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = Math.min(20, 4 + flow); ctx.beginPath(); ctx.moveTo(damX + 15, botY - 20); ctx.lineTo(W - 60, botY - 20); ctx.stroke();
    ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(W - 50, botY - 20, 16, 0, 7); ctx.fill();
    ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(damX + 40, botY - hpx); ctx.lineTo(damX + 40, botY - 20); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`head ${head} m`, damX + 46, botY - hpx / 2); ctx.fillText("turbine", W - 70, botY);
  }, [head, flow, eff]);

  return (
    <StudioChrome title="Hydroelectric Power" tagline="head × flow × gravity"
      controls={<div>
        <Slider label="Head / height drop (m)" value={head} min={2} max={200} step={2} onChange={setHead} />
        <Slider label="Flow rate (m³/s)" value={flow} min={0.5} max={100} step={0.5} onChange={setFlow} />
        <Slider label="Turbine efficiency (%)" value={eff} min={70} max={95} step={1} onChange={setEff} />
        <p className="mt-3 text-xs text-slate-500">Hydroelectric power is beautifully simple: P = ρ·g·Q·H·η, the weight of water falling per second times the height it drops, times turbine efficiency. High-head mountain schemes need little water; low-head river plants need enormous flow. It is the most efficient and dispatchable of the major renewables.</p>
      </div>}
      inspector={<div><Stat label="Power output" value={power > 1e6 ? `${(power / 1e6).toFixed(2)} MW` : `${(power / 1000).toFixed(0)} kW`} /><Stat label="Annual energy" value={`${annual.toFixed(0)} MWh`} /><Stat label="Homes powered" value={(annual * 1000 / 10000).toFixed(0)} /></div>}
    ><canvas ref={canvasRef} width={460} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
