"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

function normPDF(x: number) { return 0.3989423 * Math.exp(-x * x / 2); }
const Z: Record<number, number> = { 90: 1.2816, 95: 1.6449, 97.5: 1.9600, 99: 2.3263, 99.9: 3.0902 };

const PRESETS: Record<string, { value: number; annVol: number; annRet: number; days: number }> = {
  "Equity fund": { value: 1000000, annVol: 0.18, annRet: 0.08, days: 1 },
  "Crypto book": { value: 250000, annVol: 0.6, annRet: 0.15, days: 1 },
  "Pension (10d)": { value: 5000000, annVol: 0.1, annRet: 0.05, days: 10 },
  "Bond ladder": { value: 2000000, annVol: 0.06, annRet: 0.03, days: 30 },
};

export function VaRStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ value, annVol, annRet, days }, update] = useShareableNumbers({ value: 1000000, annVol: 0.2, annRet: 0.07, days: 1 });
  const [conf, setConf] = useState(95);

  const horizonVol = annVol * Math.sqrt(days / 252); const horizonRet = annRet * (days / 252);
  const z = Z[conf]; const varFrac = z * horizonVol - horizonRet; const VaR = varFrac * value;
  const cvarFrac = horizonVol * normPDF(z) / (1 - conf / 100) - horizonRet; const CVaR = cvarFrac * value;

  useEffect(() => {
    const W = 520, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 30, oy = H - 40, pw = W - 60, ph = H - 70; const mean = horizonRet, sd = horizonVol; const lo = mean - 4 * sd, hi = mean + 4 * sd;
    const X = (r: number) => ox + ((r - lo) / (hi - lo)) * pw;
    // pdf
    ctx.beginPath(); for (let i = 0; i <= pw; i++) { const rr = lo + (i / pw) * (hi - lo); const y = oy - normPDF((rr - mean) / sd) * ph * 0.9; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); }
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.stroke();
    // shade tail below -VaRfrac (loss)
    const cut = -varFrac; ctx.fillStyle = "rgba(239,68,68,0.35)"; ctx.beginPath(); ctx.moveTo(ox, oy); for (let i = 0; i <= pw; i++) { const rr = lo + (i / pw) * (hi - lo); if (rr > cut) break; const y = oy - normPDF((rr - mean) / sd) * ph * 0.9; ctx.lineTo(ox + i, y); } ctx.lineTo(X(cut), oy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#ef4444"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(X(cut), oy); ctx.lineTo(X(cut), oy - ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.stroke();
    ctx.fillStyle = "#fca5a5"; ctx.font = "11px sans-serif"; ctx.fillText(`${conf}% VaR`, X(cut) - 20, oy - ph + 10); ctx.fillStyle = "#94a3b8"; ctx.fillText("return distribution", ox + pw - 110, oy - ph + 10); ctx.fillText("← loss    gain →", ox + pw / 2 - 40, oy + 22);
  }, [value, annVol, annRet, days, conf]);

  const lossPct = (varFrac * 100).toFixed(1);
  const explain =
    days > 20
      ? `Over a ${days}-day horizon volatility scales by the square root of time, so the ${conf}% VaR of ${lossPct}% of the book is far larger than the one-day figure.`
      : annVol > 0.4
      ? `High ${(annVol * 100).toFixed(0)}% annual volatility dominates: at ${conf}% confidence you risk roughly ${lossPct}% of the portfolio over ${days} day${days > 1 ? "s" : ""}.`
      : annRet * (days / 252) > z * horizonVol
      ? `Expected drift outweighs the tail here, pushing the ${conf}% VaR down to just ${lossPct}% — a sign the horizon is short and the book is calm.`
      : `At ${conf}% confidence the loss should not exceed ${lossPct}% of the portfolio over ${days} day${days > 1 ? "s" : ""}; the average loss in the worse tail beyond that (expected shortfall) is steeper still.`;

  const code = `import numpy as np
from scipy.stats import norm
value, ann_vol, ann_ret, days, conf = ${value}, ${annVol}, ${annRet}, ${days}, ${conf}
z = norm.ppf(conf / 100)
h_vol = ann_vol * np.sqrt(days / 252); h_ret = ann_ret * (days / 252)
VaR = (z * h_vol - h_ret) * value
CVaR = (h_vol * norm.pdf(z) / (1 - conf / 100) - h_ret) * value
print("VaR", round(VaR), "CVaR", round(CVaR))`;

  return (
    <StudioChrome title="Value at Risk (VaR)" tagline="parametric VaR & expected shortfall"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Portfolio value ($)" value={value} min={10000} max={10000000} step={10000} onChange={(v) => update({ value: v })} />
        <Slider label="Annual volatility" value={annVol} min={0.05} max={0.6} step={0.01} onChange={(v) => update({ annVol: v })} />
        <Slider label="Annual return" value={annRet} min={-0.1} max={0.2} step={0.01} onChange={(v) => update({ annRet: v })} />
        <Slider label="Horizon (days)" value={days} min={1} max={60} step={1} onChange={(v) => update({ days: v })} />
        <div className="mt-3 grid grid-cols-5 gap-1">{Object.keys(Z).map((c) => <button key={c} onClick={() => setConf(+c)} className={`rounded-lg px-1 py-1 text-xs font-semibold ${conf === +c ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{c}%</button>)}</div>
        <p className="mt-3 text-xs text-slate-500">Value at Risk estimates the loss a portfolio will not exceed over a horizon at a confidence level. Parametric VaR assumes normally distributed returns and scales volatility by √time. Expected shortfall (CVaR) is the average loss in the tail beyond VaR. Educational tool, not investment advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label={`VaR (${conf}%)`} value={`$${VaR.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} /><Stat label="Expected shortfall" value={`$${CVaR.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} /><Stat label="Horizon vol" value={`${(horizonVol * 100).toFixed(2)}%`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
