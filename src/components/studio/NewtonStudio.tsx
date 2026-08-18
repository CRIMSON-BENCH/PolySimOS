"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parse, evaluate, derivativeExprSafe, sampleExpr } from "@/lib/engines/cas";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 480;

const PRESETS: Record<string, { x0: number }> = {
  "Fast convergence": { x0: 2 },
  "Bad guess (overshoots)": { x0: 0.75 },
  "Near a flat spot (slow)": { x0: -0.75 },
  "Far start": { x0: 5 },
};

export function NewtonStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expr, setExpr] = useState("x^3 - 2*x - 5");
  const [{ x0 }, update] = useShareableNumbers({ x0: 3 });
  const [err, setErr] = useState("");

  const iters = useMemo(() => {
    try {
      setErr(""); const f = parse(expr); const fp = parse(derivativeExprSafe(expr, "x"));
      const pts: number[] = [x0]; let x = x0;
      for (let i = 0; i < 12; i++) { const d = evaluate(fp, { x }); if (Math.abs(d) < 1e-9) break; const nx = x - evaluate(f, { x }) / d; if (!isFinite(nx)) break; pts.push(nx); if (Math.abs(nx - x) < 1e-9) { x = nx; break; } x = nx; }
      return pts;
    } catch (e) { setErr((e as Error).message); return [x0]; }
  }, [expr, x0]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    let data: { x: number; y: number }[] = []; try { data = sampleExpr(expr, "x", -6, 6, 500); } catch { /* */ }
    const ys = data.map((p) => p.y).filter(isFinite); let minY = Math.max(-30, Math.min(...ys, -5)), maxY = Math.min(30, Math.max(...ys, 5));
    if (!isFinite(minY) || minY === maxY) { minY = -10; maxY = 10; }
    const pad = 34; const sx = (x: number) => pad + ((x + 6) / 12) * (W - 2 * pad); const sy = (y: number) => H - pad - ((y - minY) / (maxY - minY || 1)) * (H - 2 * pad);
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); if (minY < 0 && maxY > 0) { ctx.moveTo(pad, sy(0)); ctx.lineTo(W - pad, sy(0)); } ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); let pen = false; for (const p of data) { if (!isFinite(p.y)) { pen = false; continue; } pen ? ctx.lineTo(sx(p.x), sy(p.y)) : ctx.moveTo(sx(p.x), sy(p.y)); pen = true; } ctx.stroke();
    // tangent steps
    try { const f = parse(expr); const fp = parse(derivativeExprSafe(expr, "x"));
      for (let i = 0; i < iters.length - 1; i++) { const x = iters[i]; const y = evaluate(f, { x }); const nx = iters[i + 1]; ctx.strokeStyle = "rgba(163,230,53,0.6)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx(x), sy(y)); ctx.lineTo(sx(nx), sy(0)); ctx.stroke(); ctx.strokeStyle = "rgba(148,163,184,0.3)"; ctx.beginPath(); ctx.moveTo(sx(x), sy(y)); ctx.lineTo(sx(x), sy(0)); ctx.stroke(); void fp; }
    } catch { /* */ }
    const root = iters[iters.length - 1]; ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(sx(root), sy(0), 6, 0, 7); ctx.fill();
  }, [expr, iters]);

  const root = iters[iters.length - 1];
  const iterCount = iters.length - 1;

  let slope0 = NaN;
  try { slope0 = evaluate(parse(derivativeExprSafe(expr, "x")), { x: x0 }); } catch { /* */ }
  const flat = isFinite(slope0) && Math.abs(slope0) < 0.5;
  const converged = isFinite(root) && iterCount < 12;

  const explain = flat
    ? `f'(x0) ≈ ${slope0.toFixed(2)} is almost zero at x0 = ${x0}, so the tangent is nearly flat. Newton divides by that tiny slope, so the next iterate is flung far away — it may stall, or jump into a completely different root's basin.`
    : converged
    ? `Starting at x0 = ${x0}, Newton reached x ≈ ${isFinite(root) ? root.toFixed(6) : "—"} in ${iterCount} steps. This is a simple root where f'(x) is well away from zero, so the error roughly squares each step (quadratic convergence) — the number of correct digits doubles per iteration.`
    : `From x0 = ${x0} the iteration did not settle within 12 steps. The starting point decides which root's basin you fall into; nudge x0 nearer a crossing (where f'(x) is safely nonzero) to recover clean quadratic convergence.`;

  const code = `import numpy as np
def f(x): return ${expr.replace(/\^/g, "**")}
def fp(x): return (f(x + 1e-6) - f(x - 1e-6)) / 2e-6
x = ${x0}
for _ in range(12):
    d = fp(x)
    if abs(d) < 1e-9: break
    nx = x - f(x) / d
    if abs(nx - x) < 1e-9:
        x = nx; break
    x = nx
print("root", x)`;

  return (
    <StudioChrome title="Newton's Method Visualizer" tagline="root finding · tangent iterations"
      controls={<div>
        <label className="mb-1 block text-xs text-slate-500">f(x)</label>
        <input value={expr} onChange={(e) => setExpr(e.target.value)} className="mb-3 w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        <p className="mb-3 text-xs text-slate-500">Newton&apos;s method slides down each tangent line to the x-axis, homing in on a root.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Start x₀" value={x0} min={-5} max={5} step={0.25} onChange={(v) => update({ x0: v })} />
        {err && <p className="text-xs text-red-500">{err}</p>}
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Root" value={isFinite(root) ? root.toFixed(6) : "—"} /><Stat label="Iterations" value={String(iters.length - 1)} /><Stat label="Convergence" value="quadratic" /><Equation tex={`x_{n+1} = x_n - \\frac{f(x_n)}{f'(x_n)}, \\quad x_0 = ${x0},\\ x_\\star \\approx ${isFinite(root) ? root.toFixed(4) : "?"}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
