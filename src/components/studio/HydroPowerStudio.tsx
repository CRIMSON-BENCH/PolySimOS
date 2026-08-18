"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { head: number; flow: number; eff: number }> = {
  "Alpine high-head": { head: 200, flow: 5, eff: 90 },
  "Run-of-river": { head: 10, flow: 80, eff: 85 },
  "Small dam": { head: 50, flow: 20, eff: 88 },
  "Micro-hydro": { head: 20, flow: 2, eff: 78 },
};

export function HydroPowerStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ head, flow, eff }, update] = useShareableNumbers({ head: 50, flow: 10, eff: 85 }); // m, m^3/s, %

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

  const explain =
    head >= 120
      ? "This is a high-head scheme: a tall drop wrings large power from a modest trickle, which is why alpine plants can run on surprisingly little water."
      : flow >= 50
      ? "A low-head, high-flow design: power comes from sheer volume, so the penstock is fat and even a small efficiency gain moves real megawatts."
      : eff <= 80
      ? "Efficiency is the cheapest lever here — every point of turbine efficiency scales output linearly, so a better runner pays back faster than more water."
      : "Power scales linearly with all three inputs (P = ρ·g·Q·H·η), so doubling either the head or the flow doubles the output at this operating point.";

  const code = `rho, g = 1000, 9.81
head, flow, eff = ${head}, ${flow}, ${eff}
power = rho * g * flow * head * eff / 100  # watts
annual = power * 8760 * 0.5 / 1e6  # MWh at 50% capacity factor
print("power kW", round(power / 1000), "| annual MWh", round(annual))`;

  return (
    <StudioChrome title="Hydroelectric Power" tagline="head × flow × gravity"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Head / height drop (m)" value={head} min={2} max={200} step={2} onChange={(v) => update({ head: v })} />
        <Slider label="Flow rate (m³/s)" value={flow} min={0.5} max={100} step={0.5} onChange={(v) => update({ flow: v })} />
        <Slider label="Turbine efficiency (%)" value={eff} min={70} max={95} step={1} onChange={(v) => update({ eff: v })} />
        <p className="mt-3 text-xs text-slate-500">Hydroelectric power is beautifully simple: P = ρ·g·Q·H·η, the weight of water falling per second times the height it drops, times turbine efficiency. High-head mountain schemes need little water; low-head river plants need enormous flow. It is the most efficient and dispatchable of the major renewables.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Power output" value={power > 1e6 ? `${(power / 1e6).toFixed(2)} MW` : `${(power / 1000).toFixed(0)} kW`} /><Stat label="Annual energy" value={`${annual.toFixed(0)} MWh`} /><Stat label="Homes powered" value={(annual * 1000 / 10000).toFixed(0)} /><Equation tex={`P = \\rho g Q H \\eta = 1000 \\cdot 9.81 \\cdot ${flow} \\cdot ${head} \\cdot ${(eff / 100).toFixed(2)} = ${(power / 1000).toFixed(0)}\\ \\text{kW}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={460} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
