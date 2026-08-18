"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parse, evaluate } from "@/lib/engines/cas";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 440;

const PRESETS: Record<string, { nRect: number }> = {
  "Coarse (n=4)": { nRect: 4 },
  "Medium (n=20)": { nRect: 20 },
  "Fine (n=60)": { nRect: 60 },
  "Very fine (n=100)": { nRect: 100 },
};

export function RiemannStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expr, setExpr] = useState("x*x*0.3 + 1");
  const [{ nRect }, update] = useShareableNumbers({ nRect: 12 });
  const [mode, setMode] = useState<"left" | "mid" | "right">("mid");
  const a = -4, b = 4;

  const { sum, exact, tree } = useMemo(() => {
    let tree; try { tree = parse(expr); } catch { return { sum: 0, exact: 0, tree: null }; }
    const f = (x: number) => { try { return evaluate(tree!, { x }); } catch { return 0; } };
    const dx = (b - a) / nRect; let sum = 0;
    for (let i = 0; i < nRect; i++) { const x = mode === "left" ? a + i * dx : mode === "right" ? a + (i + 1) * dx : a + (i + 0.5) * dx; sum += f(x) * dx; }
    let exact = 0; const fine = (b - a) / 4000; for (let i = 0; i < 4000; i++) exact += f(a + (i + 0.5) * fine) * fine;
    return { sum, exact, tree };
  }, [expr, nRect, mode]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H); if (!tree) return;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const f = (x: number) => { try { return evaluate(tree, { x }); } catch { return 0; } };
    let maxY = 0; for (let x = a; x <= b; x += 0.05) maxY = Math.max(maxY, Math.abs(f(x))); maxY = maxY || 1;
    const pad = 34; const sx = (x: number) => pad + ((x - a) / (b - a)) * (W - 2 * pad); const sy = (y: number) => H - pad - (y / maxY) * (H - 2 * pad) * 0.9 - 20;
    const dx = (b - a) / nRect;
    for (let i = 0; i < nRect; i++) { const xL = a + i * dx; const xs = mode === "left" ? xL : mode === "right" ? xL + dx : xL + dx / 2; const h = f(xs); ctx.fillStyle = "rgba(163,230,53,0.25)"; ctx.strokeStyle = "rgba(163,230,53,0.7)"; ctx.fillRect(sx(xL), sy(h), sx(xL + dx) - sx(xL), sy(0) - sy(h)); ctx.strokeRect(sx(xL), sy(h), sx(xL + dx) - sx(xL), sy(0) - sy(h)); }
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath(); for (let x = a; x <= b; x += 0.03) { const px = sx(x), py = sy(f(x)); x === a ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.stroke();
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(pad, sy(0)); ctx.lineTo(W - pad, sy(0)); ctx.stroke();
  }, [tree, nRect, mode]);

  const dxNow = (b - a) / nRect;
  const off = mode === "left" ? "0" : mode === "right" ? "1" : "0.5";
  const explain =
    `With n=${nRect} ${mode === "mid" ? "midpoint" : mode} rectangles the step is dx = ${dxNow.toFixed(3)}. ` +
    (mode === "left" || mode === "right"
      ? "Left and right sums bracket the true integral from opposite sides. "
      : "The midpoint rule already cancels much of the error at each rectangle. ") +
    `Adding subintervals shrinks the error toward the exact integral; midpoint and trapezoid rules converge fastest (error ~1/n²), so from n=${nRect} the estimate tightens quickly as you push toward n=100.`;

  const code = `import numpy as np
a, b, n = ${a}, ${b}, ${nRect}
f = lambda x: ${expr}
dx = (b - a) / n
# ${mode} Riemann sum
x = a + (np.arange(n) + ${off}) * dx
approx = np.sum(f(x) * dx)
print(approx)`;

  return (
    <StudioChrome title="Riemann Sums" tagline="approximating the definite integral"
      controls={<div>
        <label className="mb-1 block text-xs text-slate-500">f(x)</label>
        <input value={expr} onChange={(e) => setExpr(e.target.value)} className="mb-2 w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        <div className="mb-3 flex gap-2">{(["left", "mid", "right"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold capitalize ${mode === m ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{m}</button>)}</div>
        <p className="mb-3 text-xs text-slate-500">Rectangles approximate the area under the curve. Add more and the Riemann sum converges to the true integral.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Rectangles" value={nRect} min={2} max={100} step={1} onChange={(v) => update({ nRect: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Riemann sum" value={sum.toFixed(4)} /><Stat label="Exact integral" value={exact.toFixed(4)} /><Stat label="Error" value={Math.abs(sum - exact).toFixed(4)} /><Equation tex={`\\int_{${a}}^{${b}} f(x)\\,dx \\approx \\sum_{i=0}^{${nRect - 1}} f(x_i)\\,\\Delta x = ${sum.toFixed(3)},\\quad \\Delta x = ${dxNow.toFixed(3)}\\ (\\text{${mode === "mid" ? "midpoint" : mode}})`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
