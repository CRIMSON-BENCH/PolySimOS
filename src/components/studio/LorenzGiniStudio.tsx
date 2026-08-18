"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { inequality: number }> = {
  "Nordic (low)": { inequality: 0.28 },
  "US / UK": { inequality: 0.52 },
  "Emerging market": { inequality: 0.72 },
  "Extreme": { inequality: 0.95 },
};

// Lorenz curve + Gini from a lognormal-ish income distribution.
export function LorenzGiniStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ inequality }, update] = useShareableNumbers({ inequality: 0.6 });

  // incomes via power: share ~ p^k where k controls skew
  const k = 1 + inequality * 4; const N = 100;
  const incomes = Array.from({ length: N }, (_, i) => Math.pow((i + 1) / N, k));
  const total = incomes.reduce((a, b) => a + b, 0);
  const cum: number[] = [0]; let acc = 0; incomes.forEach((v) => { acc += v; cum.push(acc / total); });
  // Gini = 1 - 2 * area under Lorenz
  let area = 0; for (let i = 0; i < N; i++) area += (cum[i] + cum[i + 1]) / 2 * (1 / N);
  const gini = 1 - 2 * area;

  useEffect(() => {
    const S = 340; const ctx = hidpi(canvasRef.current!, S, S); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, S, S);
    const ox = 40, oy = S - 35, sz = S - 70; const X = (p: number) => ox + p * sz; const Y = (p: number) => oy - p * sz;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + sz, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - sz); ctx.stroke();
    // equality line
    ctx.strokeStyle = "#a3e635"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(1), Y(1)); ctx.stroke(); ctx.setLineDash([]);
    // Lorenz curve
    ctx.fillStyle = "rgba(244,114,182,0.15)"; ctx.beginPath(); ctx.moveTo(X(0), Y(0)); for (let i = 0; i <= N; i++) ctx.lineTo(X(i / N), Y(cum[i])); ctx.lineTo(X(1), Y(0)); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= N; i++) { const x = X(i / N), y = Y(cum[i]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("Lorenz curve", ox + 6, oy - sz + 14); ctx.fillText("% population →", ox + sz - 90, oy + 16);
  }, [inequality]);

  const level = gini < 0.3 ? "low (Nordic)" : gini < 0.45 ? "moderate (US/UK)" : "high";
  const top10 = (1 - cum[90]) * 100;
  const explain =
    gini < 0.3
      ? `Low inequality (Gini ${gini.toFixed(3)}): the curve hugs the diagonal and the richest 10% hold only ${top10.toFixed(0)}% of income — typical of Nordic economies.`
      : gini < 0.45
      ? `Moderate inequality (Gini ${gini.toFixed(3)}): the richest 10% take ${top10.toFixed(0)}% of income, the band most large Western economies sit in.`
      : `High inequality (Gini ${gini.toFixed(3)}): the curve bows far under the diagonal and the richest 10% capture ${top10.toFixed(0)}% of all income.`;

  const code = `import numpy as np
inequality = ${inequality}
k = 1 + inequality*4; N = 100
inc = (np.arange(1, N+1)/N)**k
cum = np.concatenate([[0], np.cumsum(inc)/inc.sum()])
gini = 1 - 2*np.trapz(cum, dx=1/N)
print("gini", round(float(gini), 3))`;

  return (
    <StudioChrome title="Lorenz Curve & Gini" tagline="measuring inequality"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Inequality level" value={inequality} min={0} max={1} step={0.02} onChange={(v) => update({ inequality: v })} />
        <p className="mt-3 text-xs text-slate-500">The Lorenz curve plots the cumulative share of income against the cumulative share of population, from poorest to richest. Perfect equality is the diagonal; the more the curve bows below it, the more unequal the distribution. The Gini coefficient is twice the area between them — 0 is total equality, 1 is one person owning everything.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Gini coefficient" value={gini.toFixed(3)} /><Stat label="Inequality" value={level} /><Stat label="Top 10% share" value={`${top10.toFixed(0)}%`} /><Equation tex={`G=1-2\\int_0^1 L(p)\\,dp=\\dfrac{A}{A+B}=${gini.toFixed(3)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={340} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
