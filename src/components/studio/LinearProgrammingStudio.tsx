"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

// Maximize c1 x + c2 y over a fixed feasible region.
const CONS = [ (x: number, y: number) => x + y <= 10, (x: number, y: number) => 2 * x + y <= 16, (x: number, y: number) => x + 3 * y <= 18 ];
const feasible = (x: number, y: number) => x >= 0 && y >= 0 && CONS.every((c) => c(x, y));

const PRESETS: Record<string, { c1: number; c2: number }> = {
  "Balanced": { c1: 3, c2: 2 },
  "x-heavy": { c1: 5, c2: 0.5 },
  "y-heavy": { c1: 0.5, c2: 5 },
  "Trade-off": { c1: -2, c2: 4 },
};

export function LinearProgrammingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ c1, c2 }, update] = useShareableNumbers({ c1: 3, c2: 2 });

  // candidate vertices from pairwise line intersections + axes
  const lines = [[1, 1, 10], [2, 1, 16], [1, 3, 18], [1, 0, 0], [0, 1, 0]];
  const verts: [number, number][] = [];
  for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
    const [a1, b1, d1] = lines[i], [a2, b2, d2] = lines[j]; const det = a1 * b2 - a2 * b1; if (Math.abs(det) < 1e-9) continue;
    const x = (d1 * b2 - d2 * b1) / det, y = (a1 * d2 - a2 * d1) / det; if (feasible(x + 1e-6, y + 1e-6) || feasible(Math.max(0, x - 1e-6), Math.max(0, y - 1e-6))) if (x >= -1e-6 && y >= -1e-6) verts.push([x, y]);
  }
  let best: [number, number] = [0, 0], bestV = -Infinity; verts.forEach(([x, y]) => { const v = c1 * x + c2 * y; if (v > bestV) { bestV = v; best = [x, y]; } });

  useEffect(() => {
    const W = 420, H = 380; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 35, sc = 32;
    for (let px = 0; px < 11; px++) for (let py = 0; py < 11; py++) { if (feasible(px, py)) { ctx.fillStyle = "rgba(34,211,238,0.15)"; ctx.fillRect(ox + px * sc - sc / 2, oy - py * sc - sc / 2, sc, sc); } }
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + 11 * sc, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - 11 * sc); ctx.stroke();
    // objective line through optimum
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); const k = bestV; if (c2 !== 0) { const x0 = 0, y0 = k / c2, x1 = 11, y1 = (k - c1 * 11) / c2; ctx.beginPath(); ctx.moveTo(ox + x0 * sc, oy - y0 * sc); ctx.lineTo(ox + x1 * sc, oy - y1 * sc); ctx.stroke(); } ctx.setLineDash([]);
    // optimum
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(ox + best[0] * sc, oy - best[1] * sc, 7, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("feasible region + optimum", ox + 4, 18); ctx.fillText("x →", ox + 11 * sc - 20, oy + 16);
  }, [c1, c2, best, bestV]);

  const explain =
    c1 <= 0 && c2 <= 0
      ? `With both coefficients ≤ 0 there is nothing to gain by producing, so the optimum collapses toward the origin at (${best[0].toFixed(1)}, ${best[1].toFixed(1)}).`
      : `Maximizing ${c1}·x + ${c2}·y lands the optimum at the corner (${best[0].toFixed(1)}, ${best[1].toFixed(1)}) worth ${bestV.toFixed(1)} — a linear objective over a convex region always peaks at a vertex, so sliding c₁/c₂ just makes the solution hop between corners.`;

  const code = `from scipy.optimize import linprog
c1, c2 = ${c1}, ${c2}
# maximize c1*x + c2*y  ->  minimize -(c1*x + c2*y)
A_ub = [[1, 1], [2, 1], [1, 3]]
b_ub = [10, 16, 18]
res = linprog(c=[-c1, -c2], A_ub=A_ub, b_ub=b_ub, bounds=[(0, None), (0, None)])
print("x,y =", res.x, "objective =", -res.fun)`;

  return (
    <StudioChrome title="Linear Programming" tagline="optimize over a feasible region"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Objective coeff. c₁ (x)" value={c1} min={-5} max={5} step={0.5} onChange={(v) => update({ c1: v })} />
        <Slider label="Objective coeff. c₂ (y)" value={c2} min={-5} max={5} step={0.5} onChange={(v) => update({ c2: v })} />
        <p className="mt-3 text-xs text-slate-500">Linear programming maximizes a linear objective subject to linear constraints. The constraints carve out a convex feasible region (shaded), and the optimum always sits at a corner. Slide the objective coefficients and watch the optimal vertex jump between corners — the geometric idea behind the simplex algorithm that runs global logistics and finance.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Optimal x" value={best[0].toFixed(2)} /><Stat label="Optimal y" value={best[1].toFixed(2)} /><Stat label="Objective value" value={bestV.toFixed(2)} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={420} height={380} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
