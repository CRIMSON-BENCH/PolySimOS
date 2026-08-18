"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { amount: number; rate: number; years: number }> = {
  "30-yr mortgage": { amount: 350000, rate: 0.065, years: 30 },
  "15-yr mortgage": { amount: 350000, rate: 0.0575, years: 15 },
  "Auto loan (5-yr)": { amount: 35000, rate: 0.075, years: 5 },
  "Student loan (10-yr)": { amount: 40000, rate: 0.055, years: 10 },
};

export function AmortizationStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ amount, rate, years }, update] = useShareableNumbers({ amount: 350000, rate: 0.065, years: 30 });

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

  const paymentStr = `$${payment.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const interestStr = `$${totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const interestPct = amount > 0 ? Math.round((totalInterest / amount) * 100) : 0;
  const explain =
    `At ${(rate * 100).toFixed(2)}% APR over ${years} years, the monthly payment is ${paymentStr} and you pay ${interestStr} in interest — about ${interestPct}% of the amount borrowed. ` +
    `The payment is level, but its split shifts: your first payment is mostly interest (${((rows[0]?.interest / payment) * 100 || 0).toFixed(0)}% of it), while the last is almost all principal. ` +
    `A higher rate or a longer term sharply raises the total interest, and paying extra early attacks principal before interest can accrue on it.`;

  const code = `# Amortization schedule for a fixed-rate loan
amount, rate, years = ${amount}, ${rate}, ${years}
n = years * 12
mr = rate / 12
payment = amount / n if mr == 0 else amount * mr / (1 - (1 + mr) ** -n)

bal = amount
total_interest = 0.0
for m in range(1, n + 1):
    interest = bal * mr
    principal = payment - interest
    bal -= principal
    total_interest += interest
    # print(m, round(payment, 2), round(interest, 2), round(principal, 2), round(max(bal, 0), 2))

print("monthly payment", round(payment, 2))
print("total interest", round(total_interest, 2))
print("total paid", round(payment * n, 2))`;

  return (
    <StudioChrome title="Loan / Mortgage Amortization" tagline="where each payment goes"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Loan amount ($)" value={amount} min={10000} max={1000000} step={10000} onChange={(v) => update({ amount: v })} />
        <Slider label="Interest rate (APR)" value={rate} min={0.01} max={0.15} step={0.0025} onChange={(v) => update({ rate: v })} />
        <Slider label="Term (years)" value={years} min={5} max={40} step={1} onChange={(v) => update({ years: v })} />
        <p className="mt-3 text-xs text-slate-500">A fixed-rate loan has a level monthly payment, but its split shifts over time: early payments are mostly interest, later ones mostly principal. That is why paying extra early, or choosing a shorter term, saves so much interest. Educational tool, not financial advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Monthly payment" value={paymentStr} />
        <Stat label="Total interest" value={interestStr} />
        <Stat label="Total paid" value={`$${totalPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <Equation tex={`M = P\\,\\dfrac{i(1+i)^n}{(1+i)^n-1},\\quad P=\\$${amount.toLocaleString()},\\ i=${mr.toFixed(5)},\\ n=${n},\\ M=\\$${Math.round(payment).toLocaleString()}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
