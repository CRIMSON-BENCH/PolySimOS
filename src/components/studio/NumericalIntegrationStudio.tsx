"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 440;

type Method = "left" | "right" | "midpoint" | "trapezoid" | "simpson";
const METHODS: { id: Method; label: string }[] = [
  { id: "left", label: "Left Riemann" },
  { id: "right", label: "Right Riemann" },
  { id: "midpoint", label: "Midpoint" },
  { id: "trapezoid", label: "Trapezoid" },
  { id: "simpson", label: "Simpson" },
];
const ORDER: Record<Method, string> = { left: "O(h)", right: "O(h)", midpoint: "O(h²)", trapezoid: "O(h²)", simpson: "O(h⁴)" };

// Function presets. `F` is the analytic antiderivative when one exists in closed form;
// presets without `F` fall back to a high-resolution Simpson reference for the exact value.
const FUNCS: Record<string, { f: (x: number) => number; py: string; tex: string; F?: (x: number) => number }> = {
  "sin(x)": { f: (x) => Math.sin(x), py: "np.sin(x)", tex: "\\sin x", F: (x) => -Math.cos(x) },
  "x²": { f: (x) => x * x, py: "x**2", tex: "x^2", F: (x) => (x * x * x) / 3 },
  "e^{-x²}": { f: (x) => Math.exp(-x * x), py: "np.exp(-x**2)", tex: "e^{-x^2}" },
  "1/(1+x²)": { f: (x) => 1 / (1 + x * x), py: "1/(1 + x**2)", tex: "\\frac{1}{1+x^{2}}", F: (x) => Math.atan(x) },
  "√x": { f: (x) => Math.sqrt(Math.max(0, x)), py: "np.sqrt(np.maximum(x, 0.0))", tex: "\\sqrt{x}" },
};

// One quadrature estimate on [a,b] with n subintervals.
function integrate(f: (x: number) => number, a: number, b: number, n: number, method: Method): number {
  if (b === a || n < 1) return 0;
  const dx = (b - a) / n;
  let s = 0;
  if (method === "left") { for (let i = 0; i < n; i++) s += f(a + i * dx); return s * dx; }
  if (method === "right") { for (let i = 1; i <= n; i++) s += f(a + i * dx); return s * dx; }
  if (method === "midpoint") { for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * dx); return s * dx; }
  if (method === "trapezoid") { s = 0.5 * (f(a) + f(b)); for (let i = 1; i < n; i++) s += f(a + i * dx); return s * dx; }
  // Simpson's rule needs an even number of panels.
  const m = n % 2 === 0 ? n : n + 1;
  const h = (b - a) / m;
  s = f(a) + f(b);
  for (let i = 1; i < m; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

// Lagrange parabola through three equally spaced points — used to draw Simpson's segments.
function parabola(x: number, x0: number, h: number, f0: number, f1: number, f2: number): number {
  const x1 = x0 + h, x2 = x0 + 2 * h;
  const l0 = ((x - x1) * (x - x2)) / ((x0 - x1) * (x0 - x2));
  const l1 = ((x - x0) * (x - x2)) / ((x1 - x0) * (x1 - x2));
  const l2 = ((x - x0) * (x - x1)) / ((x2 - x0) * (x2 - x1));
  return f0 * l0 + f1 * l1 + f2 * l2;
}

export function NumericalIntegrationStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fn, setFn] = useState("sin(x)");
  const [method, setMethod] = useState<Method>("trapezoid");
  const [{ n, a: aRaw, b: bRaw }, update] = useShareableNumbers({ n: 8, a: 0, b: 3 });

  const a = Math.min(aRaw, bRaw), b = Math.max(aRaw, bRaw);
  const spec = FUNCS[fn];

  const { estimate, exact } = useMemo(() => {
    const f = spec.f;
    const est = integrate(f, a, b, Math.max(1, Math.round(n)), method);
    // Analytic exact where known, else a high-n Simpson reference.
    const ex = spec.F ? spec.F(b) - spec.F(a) : integrate(f, a, b, 4000, "simpson");
    return { estimate: est, exact: ex };
  }, [spec, a, b, n, method]);

  const error = Math.abs(estimate - exact);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const f = spec.f;
    if (b === a) return;

    // y-range over the interval (always include 0 so the axis is visible).
    let yMin = 0, yMax = 0;
    for (let x = a; x <= b; x += (b - a) / 400) { const v = f(x); if (v < yMin) yMin = v; if (v > yMax) yMax = v; }
    if (yMax === yMin) { yMax += 1; yMin -= 1; }
    const padY = (yMax - yMin) * 0.08; yMax += padY; yMin -= padY;
    const pad = 40;
    const sx = (x: number) => pad + ((x - a) / (b - a)) * (W - 2 * pad);
    const sy = (y: number) => pad + ((yMax - y) / (yMax - yMin)) * (H - 2 * pad);

    const nn = Math.max(1, Math.round(n));
    const fillC = "rgba(163,230,53,0.20)", strokeC = "rgba(163,230,53,0.75)";
    ctx.lineWidth = 1;

    if (method === "left" || method === "right" || method === "midpoint") {
      const dx = (b - a) / nn;
      for (let i = 0; i < nn; i++) {
        const xL = a + i * dx;
        const xs = method === "left" ? xL : method === "right" ? xL + dx : xL + dx / 2;
        const h = f(xs);
        ctx.fillStyle = fillC; ctx.strokeStyle = strokeC;
        ctx.fillRect(sx(xL), sy(h), sx(xL + dx) - sx(xL), sy(0) - sy(h));
        ctx.strokeRect(sx(xL), sy(h), sx(xL + dx) - sx(xL), sy(0) - sy(h));
      }
    } else if (method === "trapezoid") {
      const dx = (b - a) / nn;
      for (let i = 0; i < nn; i++) {
        const xL = a + i * dx, xR = xL + dx, fL = f(xL), fR = f(xR);
        ctx.fillStyle = fillC; ctx.strokeStyle = strokeC;
        ctx.beginPath();
        ctx.moveTo(sx(xL), sy(0)); ctx.lineTo(sx(xL), sy(fL)); ctx.lineTo(sx(xR), sy(fR)); ctx.lineTo(sx(xR), sy(0));
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    } else {
      // Simpson: shade the region under each fitted parabola over pairs of panels.
      const m = nn % 2 === 0 ? nn : nn + 1;
      const h = (b - a) / m;
      for (let i = 0; i < m; i += 2) {
        const x0 = a + i * h, f0 = f(x0), f1 = f(x0 + h), f2 = f(x0 + 2 * h);
        ctx.fillStyle = fillC; ctx.strokeStyle = strokeC;
        ctx.beginPath(); ctx.moveTo(sx(x0), sy(0));
        for (let x = x0; x <= x0 + 2 * h + 1e-9; x += (2 * h) / 24) ctx.lineTo(sx(x), sy(parabola(x, x0, h, f0, f1, f2)));
        ctx.lineTo(sx(x0 + 2 * h), sy(0)); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }

    // Axis at y = 0.
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(pad, sy(0)); ctx.lineTo(W - pad, sy(0)); ctx.stroke();

    // The true curve f(x).
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let x = a; x <= b + 1e-9; x += (b - a) / 600) { const px = sx(x), py = sy(f(x)); x === a ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
    ctx.stroke();
  }, [spec, a, b, n, method]);

  const h = b !== a ? (b - a) / Math.max(1, Math.round(n)) : 0;
  const explain =
    `${METHODS.find((m) => m.id === method)!.label} has error ${ORDER[method]}, so halving the step ` +
    (method === "simpson"
      ? "cuts the error by ~16× — Simpson fits a parabola across each pair of panels, matching the curvature of a smooth f almost exactly. "
      : method === "midpoint" || method === "trapezoid"
      ? "cuts the error by ~4×. It only tracks the slope, not the curvature, so it trails Simpson badly on smooth functions. "
      : "only halves the error — the flat-topped rectangle ignores how f changes across each panel. ") +
    `Here |error| = ${error.toExponential(2)} at n=${Math.round(n)} (h=${h.toFixed(3)}). For smooth f, switching to Simpson typically buys several extra digits of accuracy at the same n.`;

  const dx = "dx = (b - a) / n";
  const body =
    method === "left" ? `x = a + np.arange(n) * dx
approx = np.sum(f(x)) * dx`
    : method === "right" ? `x = a + (np.arange(n) + 1) * dx
approx = np.sum(f(x)) * dx`
    : method === "midpoint" ? `x = a + (np.arange(n) + 0.5) * dx
approx = np.sum(f(x)) * dx`
    : method === "trapezoid" ? `x = np.linspace(a, b, n + 1)
approx = np.trapz(f(x), x)          # or scipy.integrate.trapezoid`
    : `m = n if n % 2 == 0 else n + 1   # Simpson needs an even panel count
x = np.linspace(a, b, m + 1)
y = f(x)
h = (b - a) / m
approx = h/3 * (y[0] + y[-1] + 4*np.sum(y[1:-1:2]) + 2*np.sum(y[2:-1:2]))
# equivalently: scipy.integrate.simpson(y, x=x)`;

  const code = `import numpy as np
# from scipy.integrate import trapezoid, simpson  # SciPy ships these too

a, b, n = ${a}, ${b}, ${Math.round(n)}
f = lambda x: ${spec.py}

${dx}
# ${METHODS.find((m) => m.id === method)!.label} rule
${body}
print("estimate:", approx)`;

  const btn = (active: boolean) =>
    `rounded-lg px-2 py-1 text-xs font-semibold ${active ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`;

  return (
    <StudioChrome title="Numerical Integration" tagline="quadrature: estimating a definite integral"
      controls={<div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Function</p>
        <div className="mb-3 grid grid-cols-3 gap-1.5">{Object.keys(FUNCS).map((k) => <button key={k} onClick={() => setFn(k)} className={btn(fn === k)}>{k}</button>)}</div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Method</p>
        <div className="mb-3 grid grid-cols-2 gap-1.5">{METHODS.map((m) => <button key={m.id} onClick={() => setMethod(m.id)} className={btn(method === m.id)}>{m.label}</button>)}</div>
        <p className="mb-3 text-xs text-slate-500">Each method approximates the shaded area under f(x). Add subintervals — or switch to Simpson — to watch the error collapse.</p>
        <Slider label="Subintervals n" value={n} min={1} max={100} step={1} onChange={(v) => update({ n: v })} />
        <Slider label="Lower bound a" value={aRaw} min={-6} max={6} step={0.5} onChange={(v) => update({ a: v })} />
        <Slider label="Upper bound b" value={bRaw} min={-6} max={6} step={0.5} onChange={(v) => update({ b: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Estimate" value={estimate.toFixed(5)} />
        <Stat label="Exact" value={exact.toFixed(5)} />
        <Stat label="|Error|" value={error.toExponential(3)} />
        <Stat label="n" value={String(Math.round(n))} />
        <Stat label="Method" value={METHODS.find((m) => m.id === method)!.label} />
        <Equation tex={`\\int_{${a}}^{${b}} ${spec.tex}\\,dx \\approx \\tfrac{h}{2}\\!\\left(f_0+2f_1+\\cdots+f_n\\right)_{\\text{trap}} = \\tfrac{h}{3}\\!\\left(f_0+4f_1+2f_2+\\cdots+f_n\\right)_{\\text{Simpson}}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
