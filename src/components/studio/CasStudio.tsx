"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { differentiateExpr, simplifyExpr, sampleExpr, solveRoot, integrateExpr } from "@/lib/engines/cas";
import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi } from "@/lib/studioKit";

const W = 760, H = 480;

export function CasStudio() {
  const [expr, setExpr] = useState("sin(x)*exp(-x/6)");
  const [xVar] = useState("x");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const result = useMemo(() => {
    try {
      const deriv = differentiateExpr(expr, xVar);
      const simplified = simplifyExpr(expr);
      const derivSimplified = simplifyExpr(deriv);
      const integral = integrateExpr(expr, xVar);
      return { ok: true as const, deriv: derivSimplified, simplified, integral, error: "" };
    } catch (e) {
      return { ok: false as const, deriv: "", simplified: "", integral: "", error: (e as Error).message };
    }
  }, [expr, xVar]);

  const root = useMemo(() => {
    try {
      return solveRoot(expr, xVar, -10, 10);
    } catch {
      return null;
    }
  }, [expr, xVar]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, W, H);
    // axes
    const pad = 36;
    const lo = -10, hi = 10;
    let fData: { x: number; y: number }[] = [];
    let dData: { x: number; y: number }[] = [];
    try {
      fData = sampleExpr(expr, xVar, lo, hi, 500);
      if (result.ok) dData = sampleExpr(result.deriv, xVar, lo, hi, 500);
    } catch {
      fData = [];
    }
    const ys = [...fData, ...dData].map((p) => p.y).filter((y) => isFinite(y));
    let minY = Math.min(...ys, -1), maxY = Math.max(...ys, 1);
    if (!isFinite(minY) || !isFinite(maxY) || minY === maxY) { minY = -2; maxY = 2; }
    const yr = maxY - minY;
    minY -= yr * 0.1; maxY += yr * 0.1;

    const sx = (x: number) => pad + ((x - lo) / (hi - lo)) * (W - 2 * pad);
    const sy = (y: number) => H - pad - ((y - minY) / (maxY - minY || 1)) * (H - 2 * pad);

    // grid + zero lines
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx(0), pad); ctx.lineTo(sx(0), H - pad); ctx.stroke();
    if (minY < 0 && maxY > 0) { ctx.beginPath(); ctx.moveTo(pad, sy(0)); ctx.lineTo(W - pad, sy(0)); ctx.stroke(); }

    const draw = (data: { x: number; y: number }[], color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      let pen = false;
      for (const pt of data) {
        if (!isFinite(pt.y)) { pen = false; continue; }
        const X = sx(pt.x), Y = sy(pt.y);
        if (!pen) { ctx.moveTo(X, Y); pen = true; } else ctx.lineTo(X, Y);
      }
      ctx.stroke();
    };
    draw(fData, "#22d3ee");
    if (result.ok) draw(dData, "#a3e635");

    // legend
    ctx.font = "12px system-ui";
    ctx.fillStyle = "#22d3ee"; ctx.fillRect(pad, 14, 10, 10);
    ctx.fillStyle = "#cbd5e1"; ctx.fillText("f(x)", pad + 14, 23);
    ctx.fillStyle = "#a3e635"; ctx.fillRect(pad + 60, 14, 10, 10);
    ctx.fillStyle = "#cbd5e1"; ctx.fillText("f'(x)", pad + 74, 23);
  }, [expr, xVar, result]);

  const examples = ["x^3 - 2*x", "sin(x)*exp(-x/6)", "cos(x^2)", "ln(x^2+1)", "1/(1+exp(-x))", "x*sin(x)"];

  const explain = !result.ok
    ? "The parser rejected this input — check for balanced parentheses and that every function is one of the supported names."
    : root !== null
    ? `f crosses zero near x = ${root.toFixed(2)}: that root is exactly where the cyan f(x) curve meets the x-axis, and where its slope f'(x) tells you how sharply it passes through.`
    : "No sign change was found in [-10, 10], so f either has no real root on that interval or only grazes the axis without crossing it.";

  const code = `import sympy as sp
x = sp.symbols("x")
f = sp.sympify("${expr.replace(/\^/g, "**")}")  # ^ -> ** for Python power
print("simplified:", sp.simplify(f))
print("d/dx      :", sp.diff(f, x))
print("integral  :", sp.integrate(f, x))
print("root ~    :", sp.nsolve(f, x, 0))  # numeric root near x=0`;

  return (
    <StudioChrome
      title="Symbolic Math (CAS) Studio"
      tagline="parser · differentiation · simplification"
      controls={
        <div>
          <label className="mb-1 block text-xs text-slate-500">Expression f(x)</label>
          <input
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            spellCheck={false}
          />
          <div className="mb-3 flex flex-wrap gap-1.5">
            {examples.map((ex) => (
              <button key={ex} onClick={() => setExpr(ex)} className="rounded-md border border-slate-300 px-2 py-0.5 font-mono text-[11px] text-slate-600 hover:border-cyan-400 dark:border-slate-700 dark:text-slate-400">
                {ex}
              </button>
            ))}
          </div>
          {result.ok ? (
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500">simplified: </span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400">{result.simplified}</span>
              </div>
              <div>
                <span className="text-slate-500">d/dx: </span>
                <span className="font-mono text-lime-600 dark:text-lime-400">{result.deriv}</span>
              </div>
              <div>
                <span className="text-slate-500">∫ dx: </span>
                <span className="font-mono text-amber-600 dark:text-amber-400">{result.integral}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-red-500">{result.error}</p>
          )}
          <ShareBar code={code} />
        </div>
      }
      inspector={
        <div>
          <Stat label="Parsed" value={result.ok ? "✓ valid" : "✗ error"} />
          <Stat label="Root in [-10,10]" value={root !== null ? root.toFixed(4) : "none found"} />
          <Stat label="Functions" value="sin cos tan exp ln √ …" />
          <ExplainResult text={explain} />
        </div>
      }
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
