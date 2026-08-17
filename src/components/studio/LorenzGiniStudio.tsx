"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Lorenz curve + Gini from a lognormal-ish income distribution.
export function LorenzGiniStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inequality, setInequality] = useState(0.6);

  // incomes via power: share ~ p^k where k controls skew
  const k = 1 + inequality * 4; const N = 100;
  const incomes = Array.from({ length: N }, (_, i) => Math.pow((i + 1) / N, k));
  const total = incomes.reduce((a, b) => a + b, 0);
  const cum: number[] = [0]; let acc = 0; incomes.forEach((v) => { acc += v; cum.push(acc / total); });
  // Gini = 1 - 2 * area under Lorenz
  let area = 0; for (let i = 0; i < N; i++) area += (cum[i] + cum[i + 1]) / 2 * (1 / N);
  const gini = 1 - 2 * area;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const S = 340; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, S, S);
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
  return (
    <StudioChrome title="Lorenz Curve & Gini" tagline="measuring inequality"
      controls={<div>
        <Slider label="Inequality level" value={inequality} min={0} max={1} step={0.02} onChange={setInequality} />
        <p className="mt-3 text-xs text-slate-500">The Lorenz curve plots the cumulative share of income against the cumulative share of population, from poorest to richest. Perfect equality is the diagonal; the more the curve bows below it, the more unequal the distribution. The Gini coefficient is twice the area between them — 0 is total equality, 1 is one person owning everything.</p>
      </div>}
      inspector={<div><Stat label="Gini coefficient" value={gini.toFixed(3)} /><Stat label="Inequality" value={level} /><Stat label="Top 10% share" value={`${((1 - cum[90]) * 100).toFixed(0)}%`} /></div>}
    ><canvas ref={canvasRef} width={340} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
