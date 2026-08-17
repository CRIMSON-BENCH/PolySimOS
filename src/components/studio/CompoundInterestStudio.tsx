"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function CompoundInterestStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [principal, setPrincipal] = useState(10000);
  const [monthly, setMonthly] = useState(500);
  const [rate, setRate] = useState(0.07);
  const [years, setYears] = useState(30);

  const months = years * 12; const mr = rate / 12;
  let balance = principal; const series: { bal: number; contrib: number }[] = [{ bal: principal, contrib: principal }];
  let contrib = principal;
  for (let m = 1; m <= months; m++) { balance = balance * (1 + mr) + monthly; contrib += monthly; series.push({ bal: balance, contrib }); }
  const final = balance; const totalContrib = contrib; const interest = final - totalContrib;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 55, oy = H - 35, pw = W - 75, ph = H - 55; const maxV = final * 1.05;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // total balance area
    ctx.fillStyle = "rgba(34,211,238,0.18)"; ctx.beginPath(); ctx.moveTo(ox, oy); series.forEach((s, i) => { const x = ox + (i / months) * pw; const y = oy - (s.bal / maxV) * ph; ctx.lineTo(x, y); }); ctx.lineTo(ox + pw, oy); ctx.closePath(); ctx.fill();
    // contributions area
    ctx.fillStyle = "rgba(148,163,184,0.35)"; ctx.beginPath(); ctx.moveTo(ox, oy); series.forEach((s, i) => { const x = ox + (i / months) * pw; const y = oy - (s.contrib / maxV) * ph; ctx.lineTo(x, y); }); ctx.lineTo(ox + pw, oy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); series.forEach((s, i) => { const x = ox + (i / months) * pw; const y = oy - (s.bal / maxV) * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("balance (cyan) vs contributions (gray)", ox + 6, oy - ph + 12); ctx.fillText(`${years} years →`, ox + pw - 70, oy + 18);
  }, [principal, monthly, rate, years]);

  return (
    <StudioChrome title="Compound Interest & Investing" tagline="the eighth wonder"
      controls={<div>
        <Slider label="Starting amount ($)" value={principal} min={0} max={100000} step={1000} onChange={setPrincipal} />
        <Slider label="Monthly contribution ($)" value={monthly} min={0} max={5000} step={50} onChange={setMonthly} />
        <Slider label="Annual return" value={rate} min={0} max={0.15} step={0.005} onChange={setRate} />
        <Slider label="Years" value={years} min={1} max={50} step={1} onChange={setYears} />
        <p className="mt-3 text-xs text-slate-500">Compounding means earning returns on your past returns, so growth accelerates over time. The gap between the balance line and your total contributions is pure compound interest — and it widens dramatically in the final years. Educational tool, not investment advice.</p>
      </div>}
      inspector={<div><Stat label="Final balance" value={`$${final.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} /><Stat label="Total contributed" value={`$${totalContrib.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} /><Stat label="Interest earned" value={`$${interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} /></div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
