"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers, PALETTE } from "@/lib/studioKit";

const W = 760, H = 480;
const TOL = 1e-6;

type Func = {
  f: (x: number) => number;
  fp: (x: number) => number;
  dom: [number, number]; // plotted x-range
  py: string;            // Python body for f(x)
  dpy: string;           // Python body for f'(x)
  x0: number;            // default starting guess (Newton / Secant first point)
  a: number;             // default bracket low  (Bisection)
  b: number;             // default bracket high (Bisection)
  sx1: number;           // default Secant second point
};

// Each preset ships analytic f and f'. Brackets [a,b] are chosen with a real sign change,
// and secant's second point sits on the opposite side of the root from x0.
const FUNCS: Record<string, Func> = {
  "x²−2":      { f: (x) => x * x - 2,               fp: (x) => 2 * x,              dom: [-0.5, 3],  py: "x**2 - 2",        dpy: "2*x",             x0: 2.5, a: 0,  b: 3,   sx1: 1.0 },
  "cos(x)−x":  { f: (x) => Math.cos(x) - x,          fp: (x) => -Math.sin(x) - 1,   dom: [-1, 2.5],  py: "np.cos(x) - x",   dpy: "-np.sin(x) - 1",  x0: 2,   a: -1, b: 2,   sx1: 0.0 },
  "x³−x−2":    { f: (x) => x * x * x - x - 2,         fp: (x) => 3 * x * x - 1,      dom: [-1, 2.5],  py: "x**3 - x - 2",    dpy: "3*x**2 - 1",      x0: 2,   a: 1,  b: 2.5, sx1: 1.0 },
  "eˣ−3x":     { f: (x) => Math.exp(x) - 3 * x,       fp: (x) => Math.exp(x) - 3,    dom: [-0.5, 2.5], py: "np.exp(x) - 3*x", dpy: "np.exp(x) - 3",   x0: 0,   a: 0,  b: 1.2, sx1: 1.2 },
  "sin(x)":    { f: (x) => Math.sin(x),              fp: (x) => Math.cos(x),        dom: [-1, 6.5],  py: "np.sin(x)",       dpy: "np.cos(x)",       x0: 2,   a: 2,  b: 4.5, sx1: 4.0 },
};

const METHODS = ["Newton–Raphson", "Bisection", "Secant"] as const;
type Method = (typeof METHODS)[number];

type NewtonStep = { x: number; fx: number; xn: number };
type BisectStep = { a: number; b: number; c: number; fc: number };
type SecantStep = { a: number; b: number; fa: number; fb: number; xn: number };

type Result =
  | { kind: "newton"; est: number[]; pts: NewtonStep[]; total: number; converged: boolean; iters: number; valid: true }
  | { kind: "bisection"; est: number[]; rows: BisectStep[]; total: number; converged: boolean; iters: number; valid: boolean }
  | { kind: "secant"; est: number[]; lines: SecantStep[]; total: number; converged: boolean; iters: number; valid: true };

function computeNewton(F: Func, x0: number): Result {
  const pts: NewtonStep[] = [];
  const est: number[] = [x0];
  let x = x0, converged = false, iters = 0;
  for (let i = 0; i < 40; i++) {
    const fx = F.f(x), d = F.fp(x);
    if (!isFinite(fx) || !isFinite(d) || Math.abs(d) < 1e-12) break;
    const xn = x - fx / d;
    pts.push({ x, fx, xn });
    est.push(xn);
    iters = i + 1;
    if (Math.abs(F.f(xn)) < TOL) { converged = true; break; }
    if (!isFinite(xn) || Math.abs(xn) > 1e6) break;
    x = xn;
  }
  return { kind: "newton", est, pts, total: pts.length, converged, iters, valid: true };
}

function computeBisection(F: Func, a0: number, b0: number): Result {
  let a = Math.min(a0, b0), b = Math.max(a0, b0);
  const rows: BisectStep[] = [];
  const est: number[] = [];
  if (F.f(a) * F.f(b) > 0 || a === b) {
    return { kind: "bisection", est, rows, total: 0, converged: false, iters: 0, valid: false };
  }
  let converged = false, iters = 0;
  for (let i = 0; i < 80; i++) {
    const c = 0.5 * (a + b), fc = F.f(c);
    rows.push({ a, b, c, fc });
    est.push(c);
    iters = i + 1;
    if (Math.abs(fc) < TOL) { converged = true; break; }
    if ((b - a) / 2 < TOL) { converged = Math.abs(fc) < 1e-4; break; }
    if (F.f(a) * fc < 0) b = c; else a = c;
  }
  return { kind: "bisection", est, rows, total: rows.length, converged, iters, valid: true };
}

function computeSecant(F: Func, x0: number, x1: number): Result {
  const lines: SecantStep[] = [];
  const est: number[] = [x1];
  let a = x0, b = x1, converged = false, iters = 0;
  for (let i = 0; i < 40; i++) {
    const fa = F.f(a), fb = F.f(b);
    if (!isFinite(fa) || !isFinite(fb) || Math.abs(fb - fa) < 1e-14) break;
    const xn = b - fb * (b - a) / (fb - fa);
    lines.push({ a, b, fa, fb, xn });
    est.push(xn);
    iters = i + 1;
    if (Math.abs(F.f(xn)) < TOL) { converged = true; break; }
    if (!isFinite(xn) || Math.abs(xn) > 1e6) break;
    a = b; b = xn;
  }
  return { kind: "secant", est, lines, total: lines.length, converged, iters, valid: true };
}

export function RootFindingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preset, setPreset] = useState<keyof typeof FUNCS>("x²−2");
  const [method, setMethod] = useState<Method>("Newton–Raphson");
  const [{ x0, a, b }, update] = useShareableNumbers({ x0: 2.5, a: 0, b: 3 });
  const [step, setStep] = useState(0);
  const timer = useRef<number | null>(null);

  const F = FUNCS[preset];

  const res = useMemo<Result>(() => {
    if (method === "Newton–Raphson") return computeNewton(F, x0);
    if (method === "Bisection") return computeBisection(F, a, b);
    return computeSecant(F, x0, F.sx1);
  }, [F, method, x0, a, b]);

  const total = res.total;
  const k = Math.min(step, total);

  // Current estimate + revealed sequence, indexed per method.
  const isBisect = res.kind === "bisection";
  const shown = isBisect ? res.est.slice(0, k) : res.est.slice(0, k + 1);
  const curEst = isBisect
    ? (k > 0 ? res.est[k - 1] : 0.5 * (a + b))
    : res.est[Math.min(k, res.est.length - 1)];
  const curFx = isFinite(curEst) ? F.f(curEst) : NaN;

  // Auto-advance (reveals iterations); the Step slider scrubs and stops playback.
  useEffect(() => {
    setStep(0);
    if (timer.current) clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setStep((s) => {
        if (s >= total) { if (timer.current) clearInterval(timer.current); return s; }
        return s + 1;
      });
    }, 550);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [method, preset, x0, a, b, total]);

  const scrub = (v: number) => { if (timer.current) clearInterval(timer.current); setStep(Math.round(v)); };

  const pickPreset = (name: keyof typeof FUNCS) => {
    const P = FUNCS[name];
    setPreset(name);
    update({ x0: P.x0, a: P.a, b: P.b });
  };

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    const [xMin, xMax] = F.dom;
    const left = 46, right = 18, top = 18, bottom = 30;
    const plotW = W - left - right, plotH = H - top - bottom;

    // y-range from samples (finite), always including 0, padded 12%.
    let yMin = Infinity, yMax = -Infinity;
    for (let i = 0; i <= 240; i++) {
      const x = xMin + (i / 240) * (xMax - xMin);
      const y = F.f(x);
      if (isFinite(y)) { if (y < yMin) yMin = y; if (y > yMax) yMax = y; }
    }
    if (!isFinite(yMin) || !isFinite(yMax)) { yMin = -1; yMax = 1; }
    yMin = Math.min(yMin, 0); yMax = Math.max(yMax, 0);
    const pad = (yMax - yMin) * 0.12 || 1; yMin -= pad; yMax += pad;

    const sx = (x: number) => left + ((x - xMin) / (xMax - xMin)) * plotW;
    const sy = (y: number) => top + ((yMax - y) / (yMax - yMin)) * plotH;

    // background
    ctx.fillStyle = PALETTE.bg; ctx.fillRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = PALETTE.grid; ctx.lineWidth = 1;
    ctx.font = "11px ui-monospace, monospace"; ctx.fillStyle = PALETTE.text;
    for (let g = 0; g <= 6; g++) {
      const gx = left + (g / 6) * plotW;
      ctx.beginPath(); ctx.moveTo(gx, top); ctx.lineTo(gx, top + plotH); ctx.stroke();
      const xv = xMin + (g / 6) * (xMax - xMin);
      ctx.textAlign = "center"; ctx.fillText(xv.toFixed(1), gx, top + plotH + 16);
    }
    for (let g = 0; g <= 5; g++) {
      const gy = top + (g / 5) * plotH;
      ctx.beginPath(); ctx.moveTo(left, gy); ctx.lineTo(left + plotW, gy); ctx.stroke();
      const yv = yMax - (g / 5) * (yMax - yMin);
      ctx.textAlign = "right"; ctx.fillText(yv.toFixed(1), left - 6, gy + 3);
    }

    // axes (x at y=0, y at x=0 when in view)
    ctx.strokeStyle = PALETTE.axis; ctx.lineWidth = 1.5;
    if (yMin < 0 && yMax > 0) { const y0 = sy(0); ctx.beginPath(); ctx.moveTo(left, y0); ctx.lineTo(left + plotW, y0); ctx.stroke(); }
    if (xMin < 0 && xMax > 0) { const x0p = sx(0); ctx.beginPath(); ctx.moveTo(x0p, top); ctx.lineTo(x0p, top + plotH); ctx.stroke(); }

    // f(x) curve
    ctx.strokeStyle = PALETTE.primary; ctx.lineWidth = 2.5; ctx.beginPath();
    let started = false;
    for (let px = 0; px <= plotW; px++) {
      const x = xMin + (px / plotW) * (xMax - xMin);
      const y = F.f(x);
      if (!isFinite(y)) { started = false; continue; }
      const cx = left + px, cy = sy(y);
      if (cy < top - 40 || cy > top + plotH + 40) { started = false; continue; }
      if (started) ctx.lineTo(cx, cy); else { ctx.moveTo(cx, cy); started = true; }
    }
    ctx.stroke();

    const geom = "#f59e0b"; // amber — method construction lines
    const dot = (x: number, y: number, r: number, color: string) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(sx(x), sy(y), r, 0, 7); ctx.fill(); };

    // method geometry up to step k
    if (res.kind === "newton") {
      for (let i = 0; i < k; i++) {
        const p = res.pts[i];
        ctx.strokeStyle = geom; ctx.lineWidth = 1.6; ctx.beginPath();
        ctx.moveTo(sx(p.x), sy(p.fx)); ctx.lineTo(sx(p.xn), sy(0)); ctx.stroke();
        ctx.setLineDash([4, 4]); ctx.strokeStyle = "#64748b"; ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(sx(p.xn), sy(0)); ctx.lineTo(sx(p.xn), sy(F.f(p.xn))); ctx.stroke(); ctx.setLineDash([]);
        dot(p.x, p.fx, 3.5, "#f472b6");
      }
    } else if (res.kind === "bisection") {
      const row = k > 0 ? res.rows[k - 1] : { a, b, c: 0.5 * (a + b), fc: F.f(0.5 * (a + b)) };
      ctx.fillStyle = "rgba(34,211,238,0.10)";
      ctx.fillRect(sx(row.a), top, sx(row.b) - sx(row.a), plotH);
      ctx.strokeStyle = geom; ctx.lineWidth = 1.6;
      for (const xv of [row.a, row.b]) { ctx.beginPath(); ctx.moveTo(sx(xv), top); ctx.lineTo(sx(xv), top + plotH); ctx.stroke(); }
      ctx.setLineDash([4, 4]); ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(sx(row.c), top); ctx.lineTo(sx(row.c), top + plotH); ctx.stroke(); ctx.setLineDash([]);
      dot(row.c, F.f(row.c), 3.5, "#f472b6");
    } else {
      for (let i = 0; i < k; i++) {
        const l = res.lines[i];
        ctx.strokeStyle = geom; ctx.lineWidth = 1.6; ctx.beginPath();
        // secant through the two points, extended to the x-axis intercept
        ctx.moveTo(sx(l.a), sy(l.fa)); ctx.lineTo(sx(l.xn), sy(0)); ctx.stroke();
        ctx.setLineDash([4, 4]); ctx.strokeStyle = "#64748b"; ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(sx(l.xn), sy(0)); ctx.lineTo(sx(l.xn), sy(F.f(l.xn))); ctx.stroke(); ctx.setLineDash([]);
        dot(l.a, l.fa, 3.5, "#f472b6"); dot(l.b, l.fb, 3.5, "#f472b6");
      }
    }

    // current estimate marker
    if (isFinite(curEst) && isFinite(curFx)) {
      ctx.strokeStyle = PALETTE.accent; ctx.lineWidth = 1.5; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(sx(curEst), sy(0)); ctx.lineTo(sx(curEst), sy(curFx)); ctx.stroke(); ctx.setLineDash([]);
      dot(curEst, 0, 5, PALETTE.accent);
      dot(curEst, curFx, 4, PALETTE.accent);
    }
  }, [F, res, k, curEst, curFx]);

  const orderNote =
    method === "Newton–Raphson"
      ? "Near a simple root Newton roughly doubles the number of correct digits each step (quadratic convergence)."
      : method === "Bisection"
      ? "The bracket halves every step — one more correct bit per iteration (linear convergence)."
      : "The secant method converges superlinearly (order ≈ 1.618), between bisection and Newton, and needs no derivative.";

  const explain = (() => {
    if (method === "Bisection" && !res.valid)
      return `Bisection can't start: f(${a}) and f(${b}) have the same sign, so no root is guaranteed inside [${a}, ${b}]. Move the bracket sliders so the curve crosses zero between a and b.`;
    if (res.converged)
      return `${method} converged to x ≈ ${curEst.toFixed(6)} in ${res.iters} iterations (|f(x)| < 1e-6). ${orderNote}`;
    return `${method} did not reach the 1e-6 tolerance within the iteration cap${
      method === "Newton–Raphson"
        ? " — a near-zero derivative f'(x) or a starting guess far from the root can throw the tangent step away from the crossing."
        : method === "Secant"
        ? " — nearly equal function values make the secant slope blow up. Try a starting guess nearer where the curve crosses zero."
        : "."
    }`;
  })();

  const code = (() => {
    if (method === "Newton–Raphson")
      return `import numpy as np

def f(x):  return ${F.py}
def df(x): return ${F.dpy}

x = ${x0}
for i in range(100):
    fx = f(x)
    if abs(fx) < 1e-6:
        break
    x = x - fx / df(x)          # Newton step
print("root", x, "f(root)", f(x), "iters", i)`;
    if (method === "Bisection")
      return `import numpy as np

def f(x): return ${F.py}

a, b = ${a}, ${b}
assert f(a) * f(b) < 0, "need a sign change on [a, b]"
for i in range(100):
    c = 0.5 * (a + b)
    if abs(f(c)) < 1e-6 or (b - a) / 2 < 1e-6:
        break
    if f(a) * f(c) < 0: b = c
    else:               a = c
print("root", c, "f(root)", f(c), "iters", i)`;
    return `import numpy as np

def f(x): return ${F.py}

x0, x1 = ${x0}, ${F.sx1}
for i in range(100):
    f0, f1 = f(x0), f(x1)
    if abs(f1) < 1e-6:
        break
    x0, x1 = x1, x1 - f1 * (x1 - x0) / (f1 - f0)   # secant step
print("root", x1, "f(root)", f(x1), "iters", i)`;
  })();

  const tex =
    method === "Newton–Raphson"
      ? `x_{n+1}=x_n-\\frac{f(x_n)}{f'(x_n)}`
      : method === "Bisection"
      ? `c=\\tfrac{a+b}{2},\\;\\; [a,b]\\to\\begin{cases}[a,c]&f(a)f(c)<0\\\\[c,b]&\\text{otherwise}\\end{cases}`
      : `x_{n+1}=x_n-f(x_n)\\,\\frac{x_n-x_{n-1}}{f(x_n)-f(x_{n-1})}`;

  const order = method === "Newton–Raphson" ? "≈ 2 (quadratic)" : method === "Bisection" ? "1 (linear)" : "≈ 1.618";

  return (
    <StudioChrome title="Root Finding Studio" tagline="Newton · bisection · secant"
      controls={<div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Function</p>
        <div className="mb-3 grid grid-cols-2 gap-1.5">{(Object.keys(FUNCS) as (keyof typeof FUNCS)[]).map((s) => <button key={s} onClick={() => pickPreset(s)} className={`rounded-lg px-2 py-1 text-xs font-semibold ${preset === s ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{s}</button>)}</div>

        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Method</p>
        <div className="mb-3 grid grid-cols-1 gap-1.5">{METHODS.map((m) => <button key={m} onClick={() => setMethod(m)} className={`rounded-lg px-2 py-1 text-xs font-semibold ${method === m ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{m}</button>)}</div>

        <p className="mb-3 text-xs text-slate-500">Solve f(x) = 0. Watch the method step toward the root — Newton rides the tangent, bisection halves the bracket, secant draws chords.</p>

        <Presets
          presets={Object.keys(FUNCS).map((label) => ({ label }))}
          onApply={(label) => pickPreset(label as keyof typeof FUNCS)}
        />

        {method !== "Bisection" && (
          <Slider label="Start guess x₀" value={x0} min={F.dom[0]} max={F.dom[1]} step={0.05} onChange={(v) => update({ x0: v })} />
        )}
        {method === "Bisection" && <>
          <Slider label="Bracket a" value={a} min={F.dom[0]} max={F.dom[1]} step={0.05} onChange={(v) => update({ a: v })} />
          <Slider label="Bracket b" value={b} min={F.dom[0]} max={F.dom[1]} step={0.05} onChange={(v) => update({ b: v })} />
        </>}
        <Slider label="Step" value={k} min={0} max={Math.max(total, 1)} step={1} onChange={scrub} />

        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Method" value={method} />
        <Stat label="Step" value={`${k}/${total}`} />
        <Stat label="Estimate x" value={isFinite(curEst) ? curEst.toFixed(6) : "—"} />
        <Stat label="|f(x)|" value={isFinite(curFx) ? Math.abs(curFx).toExponential(2) : "—"} />
        <Stat label="Iters to 1e-6" value={res.valid ? (res.converged ? String(res.iters) : "did not converge") : "no sign change"} />
        <Stat label="Order" value={order} />
        <Equation tex={tex} />
        {shown.length > 0 && (
          <div className="mt-3 max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white/60 p-2 font-mono text-[11px] text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
            {shown.map((e, i) => (
              <div key={i} className="flex justify-between gap-3">
                <span className="text-slate-400">{isBisect ? `c${i + 1}` : `x${i}`}</span>
                <span>{e.toFixed(6)}</span>
              </div>
            ))}
          </div>
        )}
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
