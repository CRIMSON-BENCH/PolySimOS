"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { principal: number; monthly: number; rate: number; years: number }> = {
  "Savings account": { principal: 5000, monthly: 200, rate: 0.02, years: 10 },
  "Index-fund investing": { principal: 10000, monthly: 500, rate: 0.07, years: 30 },
  "Aggressive growth": { principal: 5000, monthly: 500, rate: 0.12, years: 20 },
  "Retirement (long horizon)": { principal: 20000, monthly: 1000, rate: 0.08, years: 40 },
};

export function CompoundInterestStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ principal, monthly, rate, years }, update] = useShareableNumbers({ principal: 10000, monthly: 500, rate: 0.07, years: 30 });

  const months = years * 12; const mr = rate / 12;
  let balance = principal; const series: { bal: number; contrib: number }[] = [{ bal: principal, contrib: principal }];
  let contrib = principal;
  for (let m = 1; m <= months; m++) { balance = balance * (1 + mr) + monthly; contrib += monthly; series.push({ bal: balance, contrib }); }
  const final = balance; const totalContrib = contrib; const interest = final - totalContrib;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 55, oy = H - 35, pw = W - 75, ph = H - 55; const maxV = final * 1.05;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // total balance area
    ctx.fillStyle = "rgba(34,211,238,0.18)"; ctx.beginPath(); ctx.moveTo(ox, oy); series.forEach((s, i) => { const x = ox + (i / months) * pw; const y = oy - (s.bal / maxV) * ph; ctx.lineTo(x, y); }); ctx.lineTo(ox + pw, oy); ctx.closePath(); ctx.fill();
    // contributions area
    ctx.fillStyle = "rgba(148,163,184,0.35)"; ctx.beginPath(); ctx.moveTo(ox, oy); series.forEach((s, i) => { const x = ox + (i / months) * pw; const y = oy - (s.contrib / maxV) * ph; ctx.lineTo(x, y); }); ctx.lineTo(ox + pw, oy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); series.forEach((s, i) => { const x = ox + (i / months) * pw; const y = oy - (s.bal / maxV) * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("balance (cyan) vs contributions (gray)", ox + 6, oy - ph + 12); ctx.fillText(`${years} years →`, ox + pw - 70, oy + 18);
  }, [principal, monthly, rate, years]);

  const ratePct = rate * 100;
  const doubling = rate > 0 ? 72 / ratePct : Infinity;
  const explain = rate <= 0
    ? `At a 0% return nothing compounds — after ${years} years the balance is exactly what you put in, ${'$'}${totalContrib.toLocaleString(undefined, { maximumFractionDigits: 0 })}. Any positive return is what sets the snowball rolling.`
    : `Rule of 72: at ${ratePct.toFixed(1)}% a year, money roughly doubles every ${doubling.toFixed(1)} years — about ${Math.floor(years / doubling)} doublings across your ${years}-year horizon. Each ${'$'}${monthly.toLocaleString()}/mo contribution then earns returns on its own past returns, so the balance curve pulls away from your flat contribution line. Because compounding is exponential, most of the ${'$'}${interest.toLocaleString(undefined, { maximumFractionDigits: 0 })} in interest is created in the final years — time in the market matters far more than the amount. Educational tool, not investment advice.`;

  const code = `principal, monthly, rate, years = ${principal}, ${monthly}, ${rate}, ${years}
months, mr = years * 12, rate / 12
balance = principal
contrib = principal
for m in range(1, months + 1):
    balance = balance * (1 + mr) + monthly
    contrib += monthly
print("final balance", round(balance, 2))
print("total contributed", round(contrib, 2))
print("interest earned", round(balance - contrib, 2))
print("years to double (rule of 72)", round(72 / (rate * 100), 1))`;

  return (
    <StudioChrome title="Compound Interest & Investing" tagline="the eighth wonder"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Starting amount ($)" value={principal} min={0} max={100000} step={1000} onChange={(v) => update({ principal: v })} />
        <Slider label="Monthly contribution ($)" value={monthly} min={0} max={5000} step={50} onChange={(v) => update({ monthly: v })} />
        <Slider label="Annual return" value={rate} min={0} max={0.15} step={0.005} onChange={(v) => update({ rate: v })} />
        <Slider label="Years" value={years} min={1} max={50} step={1} onChange={(v) => update({ years: v })} />
        <p className="mt-3 text-xs text-slate-500">Compounding means earning returns on your past returns, so growth accelerates over time. The gap between the balance line and your total contributions is pure compound interest — and it widens dramatically in the final years. Educational tool, not investment advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Final balance" value={`$${final.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} /><Stat label="Total contributed" value={`$${totalContrib.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} /><Stat label="Interest earned" value={`$${interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} /><Equation tex={`A = ${principal.toLocaleString()}\\left(1+\\tfrac{${rate.toFixed(3)}}{12}\\right)^{${months}} + ${monthly}\\cdot\\frac{\\left(1+\\tfrac{${rate.toFixed(3)}}{12}\\right)^{${months}}-1}{${(rate/12).toFixed(5)}} = \\$${final.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
