"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { alpha: number; income: number; px: number; py: number }> = {
  "Balanced taste": { alpha: 0.5, income: 100, px: 4, py: 3 },
  "Strong X-lover": { alpha: 0.8, income: 100, px: 4, py: 3 },
  "X gets cheap": { alpha: 0.5, income: 100, px: 1, py: 5 },
  "Higher income": { alpha: 0.5, income: 300, px: 4, py: 3 },
};

// Consumer choice: U = x^a y^(1-a), budget px x + py y = I.
export function IndifferenceCurveStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ alpha, income, px, py }, update] = useShareableNumbers({ alpha: 0.5, income: 100, px: 4, py: 3 });

  const x = alpha * income / px, y = (1 - alpha) * income / py; const U = Math.pow(x, alpha) * Math.pow(y, 1 - alpha);

  useEffect(() => {
    const W = 460, H = 360; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const xMax = income / px * 1.2, yMax = income / py * 1.2;
    const X = (xx: number) => ox + (xx / xMax) * pw; const Y = (yy: number) => oy - (yy / yMax) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // indifference curves
    [U * 0.7, U, U * 1.3].forEach((uu, i) => { ctx.strokeStyle = i === 1 ? "#22d3ee" : "#1e3a5f"; ctx.lineWidth = i === 1 ? 2 : 1.2; ctx.beginPath(); let started = false; for (let xx = 0.3; xx < xMax; xx += 0.3) { const yy = Math.pow(uu / Math.pow(xx, alpha), 1 / (1 - alpha)); if (yy > 0 && yy < yMax) { started ? ctx.lineTo(X(xx), Y(yy)) : ctx.moveTo(X(xx), Y(yy)); started = true; } } ctx.stroke(); });
    // budget line
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(0), Y(income / py)); ctx.lineTo(X(income / px), Y(0)); ctx.stroke();
    ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(X(x), Y(y), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("indifference curves + budget line", ox + 6, oy - ph + 14); ctx.fillText("good X →", ox + pw - 60, oy + 16); ctx.save(); ctx.translate(16, oy - ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("good Y", -20, 0); ctx.restore();
  }, [alpha, income, px, py]);

  const explain = `With Cobb-Douglas preferences the optimal bundle spends a fixed income share on each good — here ${(alpha * 100).toFixed(0)}% of income (${(alpha * income).toFixed(0)}) buys X and ${((1 - alpha) * 100).toFixed(0)}% buys Y, no matter how prices move; a price only changes how many units that fixed budget buys.`;

  const pyCode = `alpha, income, px, py = ${alpha}, ${income}, ${px}, ${py}
x = alpha * income / px           # optimal good X
y = (1 - alpha) * income / py     # optimal good Y
U = x**alpha * y**(1 - alpha)     # utility at the optimum
print("spend on X:", alpha * income, " spend on Y:", (1 - alpha) * income)
print("x:", x, "y:", y, "U:", U)`;

  return (
    <StudioChrome title="Consumer Choice" tagline="indifference curves & budget"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Preference for X (α)" value={alpha} min={0.1} max={0.9} step={0.05} onChange={(v) => update({ alpha: v })} />
        <Slider label="Income" value={income} min={40} max={300} step={10} onChange={(v) => update({ income: v })} />
        <Slider label="Price of X" value={px} min={1} max={10} step={0.5} onChange={(v) => update({ px: v })} />
        <Slider label="Price of Y" value={py} min={1} max={10} step={0.5} onChange={(v) => update({ py: v })} />
        <p className="mt-3 text-xs text-slate-500">A consumer maximizes utility subject to a budget. Indifference curves connect equally-satisfying bundles; the budget line shows what income affords. The best choice is where the budget line just touches the highest reachable indifference curve — the tangency where the marginal rate of substitution equals the price ratio. Change a price and watch the optimal bundle move.</p>
        <ShareBar code={pyCode} />
      </div>}
      inspector={<div><Stat label="Optimal X" value={x.toFixed(1)} /><Stat label="Optimal Y" value={y.toFixed(1)} /><Stat label="Utility" value={U.toFixed(1)} /><Equation tex={`U(x,y)=x^{${alpha}}y^{${(1 - alpha).toFixed(2)}},\\quad ${px}\\,x+${py}\\,y=${income},\\quad \\text{MRS}=\\frac{${alpha}}{${(1 - alpha).toFixed(2)}}\\frac{y}{x}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={460} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
