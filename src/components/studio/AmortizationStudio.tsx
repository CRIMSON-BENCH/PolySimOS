"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function AmortizationStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [amount, setAmount] = useState(350000);
  const [rate, setRate] = useState(0.065);
  const [years, setYears] = useState(30);

  const n = years * 12; const mr = rate / 12;
  const payment = mr === 0 ? amount / n : amount * mr / (1 - Math.pow(1 + mr, -n));
  let bal = amount; let totalInterest = 0; const rows: { principal: number; interest: number; bal: number }[] = [];
  for (let m = 0; m < n; m++) { const interest = bal * mr; const principal = payment - interest; bal -= principal; totalInterest += interest; rows.push({ principal, interest, bal: Math.max(0, bal) }); }
  const totalPaid = payment * n;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    // stacked: each month principal vs interest portion of payment
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const step = pw / n;
    rows.forEach((r, i) => { const x = ox + i * step; const ih = (r.interest / payment) * ph; const ph2 = (r.principal / payment) * ph;
      ctx.fillStyle = "#f472b6"; ctx.fillRect(x, oy - ih, Math.max(1, step), ih); ctx.fillStyle = "#22d3ee"; ctx.fillRect(x, oy - ih - ph2, Math.max(1, step), ph2); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("each payment: interest (pink) vs principal (cyan)", ox + 6, oy - ph + 12); ctx.fillText(`${years} years →`, ox + pw - 70, oy + 18);
  }, [amount, rate, years]);

  return (
    <StudioChrome title="Loan / Mortgage Amortization" tagline="where each payment goes"
      controls={<div>
        <Slider label="Loan amount ($)" value={amount} min={10000} max={1000000} step={10000} onChange={setAmount} />
        <Slider label="Interest rate (APR)" value={rate} min={0.01} max={0.15} step={0.0025} onChange={setRate} />
        <Slider label="Term (years)" value={years} min={5} max={40} step={1} onChange={setYears} />
        <p className="mt-3 text-xs text-slate-500">A fixed-rate loan has a level monthly payment, but its split shifts over time: early payments are mostly interest, later ones mostly principal. That is why paying extra early, or choosing a shorter term, saves so much interest. Educational tool, not financial advice.</p>
      </div>}
      inspector={<div><Stat label="Monthly payment" value={`$${payment.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} /><Stat label="Total interest" value={`$${totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} /><Stat label="Total paid" value={`$${totalPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} /></div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
