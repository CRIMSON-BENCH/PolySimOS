"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Levelized cost of energy.
export function LCOEStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capex, setCapex] = useState(1200); // $/kW
  const [capFactor, setCapFactor] = useState(25); // %
  const [discount, setDiscount] = useState(6); // %
  const [lifetime, setLifetime] = useState(25); // yr
  const [opex, setOpex] = useState(20); // $/kW/yr

  const r = discount / 100; const CRF = r * Math.pow(1 + r, lifetime) / (Math.pow(1 + r, lifetime) - 1);
  const annualGen = capFactor / 100 * 8760; // kWh per kW per year
  const lcoe = (capex * CRF + opex) / annualGen * 1000; // $/MWh

  const refs = [["Solar PV", 40], ["Wind", 35], ["Gas (CCGT)", 60], ["Nuclear", 90], ["Coal", 80]] as const;

  useEffect(() => {
    const W = 460, H = 280; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const items = [["Your project", lcoe] as const, ...refs]; const max = Math.max(...items.map((i) => i[1]), lcoe) * 1.1;
    items.forEach(([n, v], i) => { const y = 30 + i * 40; const bw = (v / max) * (W - 160); ctx.fillStyle = n === "Your project" ? "#f472b6" : "#22d3ee"; ctx.fillRect(120, y, bw, 24); ctx.fillStyle = "#e2e8f0"; ctx.font = "11px sans-serif"; ctx.textAlign = "right"; ctx.fillText(n, 112, y + 16); ctx.textAlign = "left"; ctx.fillText(`$${v.toFixed(0)}`, 124 + bw, y + 16); });
    ctx.textAlign = "left"; ctx.fillStyle = "#94a3b8"; ctx.fillText("LCOE ($/MWh)", 120, 18);
  }, [capex, capFactor, discount, lifetime, opex, lcoe]);

  return (
    <StudioChrome title="Levelized Cost of Energy" tagline="the true price per MWh"
      controls={<div>
        <Slider label="Capital cost ($/kW)" value={capex} min={500} max={6000} step={100} onChange={setCapex} />
        <Slider label="Capacity factor (%)" value={capFactor} min={10} max={95} step={1} onChange={setCapFactor} />
        <Slider label="Discount rate (%)" value={discount} min={2} max={12} step={0.5} onChange={setDiscount} />
        <Slider label="Lifetime (years)" value={lifetime} min={10} max={40} step={1} onChange={setLifetime} />
        <Slider label="Fixed O&M ($/kW/yr)" value={opex} min={5} max={150} step={5} onChange={setOpex} />
        <p className="mt-3 text-xs text-slate-500">LCOE spreads a power project&apos;s lifetime cost over every megawatt-hour it produces, letting wildly different technologies be compared fairly. It rewards high capacity factors and cheap capital, and punishes idle plants. The capital-recovery factor discounts future costs to today. It is the number that has made solar and wind the cheapest new power in most of the world.</p>
      </div>}
      inspector={<div><Stat label="LCOE" value={`$${lcoe.toFixed(0)}/MWh`} /><Stat label="Per kWh" value={`${(lcoe / 10).toFixed(1)}¢`} /><Stat label="Capacity factor" value={`${capFactor}%`} /></div>}
    ><canvas ref={canvasRef} width={460} height={280} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
