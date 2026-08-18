"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sampleExpr } from "@/lib/engines/cas";
import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi } from "@/lib/studioKit";

const W = 760, H = 480;
const COLORS = ["#22d3ee", "#a3e635", "#f472b6"];

export function GrapherStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [exprs, setExprs] = useState(["sin(x)", "x^2/8 - 2", "cos(x/2)*3"]);
  const [range, setRange] = useState(10);

  const data = useMemo(() => exprs.map((e) => { try { return sampleExpr(e, "x", -range, range, 600); } catch { return []; } }), [exprs, range]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ys = data.flat().map((p) => p.y).filter(isFinite);
    let minY = Math.min(...ys, -1), maxY = Math.max(...ys, 1);
    if (!isFinite(minY) || minY === maxY) { minY = -5; maxY = 5; }
    const yr = maxY - minY; minY -= yr * 0.1; maxY += yr * 0.1;
    const pad = 34; const sx = (x: number) => pad + ((x + range) / (2 * range)) * (W - 2 * pad); const sy = (y: number) => H - pad - ((y - minY) / (maxY - minY || 1)) * (H - 2 * pad);
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(sx(0), pad); ctx.lineTo(sx(0), H - pad); if (minY < 0 && maxY > 0) { ctx.moveTo(pad, sy(0)); ctx.lineTo(W - pad, sy(0)); } ctx.stroke();
    data.forEach((series, ci) => {
      ctx.strokeStyle = COLORS[ci]; ctx.lineWidth = 2; ctx.beginPath(); let pen = false;
      for (const p of series) { if (!isFinite(p.y)) { pen = false; continue; } const X = sx(p.x), Y = sy(p.y); pen ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); pen = true; } ctx.stroke();
    });
  }, [data, range]);

  const nFns = exprs.filter(Boolean).length;
  const explain = `Plotting ${nFns} function${nFns === 1 ? "" : "s"} sampled at 600 points over x ∈ [−${range}, ${range}]. Widen the range to expose end behavior and periodicity; narrow it to zoom in on roots and turning points where the curves cross the axis.`;

  const code = `import numpy as np
x = np.linspace(-${range}, ${range}, 600)
exprs = ${JSON.stringify(exprs)}
for e in exprs:
    y = eval(e.replace("^", "**"), {"x": x, "sin": np.sin, "cos": np.cos, "sqrt": np.sqrt})
    print(e, "->", y[:3])`;

  return (
    <StudioChrome title="Function Grapher" tagline="plot up to three functions"
      controls={<div>
        {exprs.map((e, i) => (
          <div key={i} className="mb-2 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: COLORS[i] }} />
            <input value={e} onChange={(ev) => setExprs((x) => x.map((v, j) => (j === i ? ev.target.value : v)))} className="w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </div>
        ))}
        <div className="mt-3"><div className="mb-1 flex justify-between text-xs text-slate-500"><span>x range ±</span><span className="font-mono">{range}</span></div>
          <input type="range" min={2} max={50} step={1} value={range} onChange={(e) => setRange(parseFloat(e.target.value))} className="w-full accent-cyan-500" /></div>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Functions" value={String(exprs.filter(Boolean).length)} /><Stat label="Samples" value="600" /><Stat label="Engine" value="PolySim CAS" /><ExplainResult text={explain} /></div>}
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
