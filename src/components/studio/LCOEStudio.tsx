"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { capex: number; capFactor: number; discount: number; lifetime: number; opex: number }> = {
  "Utility solar": { capex: 1000, capFactor: 25, discount: 5, lifetime: 30, opex: 15 },
  "Onshore wind": { capex: 1500, capFactor: 40, discount: 5, lifetime: 25, opex: 40 },
  "Gas CCGT": { capex: 1100, capFactor: 55, discount: 7, lifetime: 30, opex: 25 },
  "Nuclear": { capex: 6000, capFactor: 90, discount: 8, lifetime: 40, opex: 120 },
};

// Levelized cost of energy.
export function LCOEStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ capex, capFactor, discount, lifetime, opex }, update] = useShareableNumbers({
    capex: 1200, // $/kW
    capFactor: 25, // %
    discount: 6, // %
    lifetime: 25, // yr
    opex: 20, // $/kW/yr
  });

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

  const capShare = (capex * CRF) / (capex * CRF + opex);
  const explain =
    capFactor < 30
      ? `At a ${capFactor}% capacity factor the plant sits idle most of the time, so its capital is spread over few MWh — that thin denominator is what pushes LCOE up to $${lcoe.toFixed(0)}/MWh.`
      : capShare > 0.75
      ? `About ${(capShare * 100).toFixed(0)}% of this $${lcoe.toFixed(0)}/MWh is capital recovery, so the ${discount}% discount rate — not fuel or O&M — is the dominant lever here.`
      : `A healthy ${capFactor}% capacity factor keeps LCOE at $${lcoe.toFixed(0)}/MWh; raising the discount rate above ${discount}% would hit this capital-heavy project hardest.`;

  const code = `capex, cap_factor, discount, lifetime, opex = ${capex}, ${capFactor}, ${discount}, ${lifetime}, ${opex}
r = discount / 100
crf = r * (1 + r) ** lifetime / ((1 + r) ** lifetime - 1)   # capital-recovery factor
annual_gen = cap_factor / 100 * 8760                          # kWh per kW per year
lcoe = (capex * crf + opex) / annual_gen * 1000               # $/MWh
print(round(lcoe), "$/MWh")`;

  return (
    <StudioChrome title="Levelized Cost of Energy" tagline="the true price per MWh"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Capital cost ($/kW)" value={capex} min={500} max={6000} step={100} onChange={(v) => update({ capex: v })} />
        <Slider label="Capacity factor (%)" value={capFactor} min={10} max={95} step={1} onChange={(v) => update({ capFactor: v })} />
        <Slider label="Discount rate (%)" value={discount} min={2} max={12} step={0.5} onChange={(v) => update({ discount: v })} />
        <Slider label="Lifetime (years)" value={lifetime} min={10} max={40} step={1} onChange={(v) => update({ lifetime: v })} />
        <Slider label="Fixed O&M ($/kW/yr)" value={opex} min={5} max={150} step={5} onChange={(v) => update({ opex: v })} />
        <p className="mt-3 text-xs text-slate-500">LCOE spreads a power project&apos;s lifetime cost over every megawatt-hour it produces, letting wildly different technologies be compared fairly. It rewards high capacity factors and cheap capital, and punishes idle plants. The capital-recovery factor discounts future costs to today. It is the number that has made solar and wind the cheapest new power in most of the world.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="LCOE" value={`$${lcoe.toFixed(0)}/MWh`} /><Stat label="Per kWh" value={`${(lcoe / 10).toFixed(1)}¢`} /><Stat label="Capacity factor" value={`${capFactor}%`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={460} height={280} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
