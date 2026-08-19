"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 480, PAD = 42;

type Model = {
  label: string;
  paramNames: string[];
  truth: number[];
  init: (xs: number[], ys: number[]) => number[];
  f: (p: number[], x: number) => number;
  xrange: [number, number];
  tex: (p: number[]) => string;
  py: string; // python model body, params after x
  p0: string; // python initial guess
};

const fmt = (n: number, d = 3) => (Number.isFinite(n) ? Number(n.toFixed(d)).toString() : "—");

// The five nonlinear model presets. Each carries its "true" parameters (for data
// generation), a deliberately-offset starting guess, and the model function.
const MODELS: Record<string, Model> = {
  Exponential: {
    label: "a·e^{bx}",
    paramNames: ["a", "b"],
    truth: [2, 0.6],
    init: () => [1, 0.2],
    f: (p, x) => p[0] * Math.exp(p[1] * x),
    xrange: [0, 4],
    tex: (p) => `y = ${fmt(p[0])}\\,e^{${fmt(p[1])}\\,x}`,
    py: "return a * np.exp(b * x)",
    p0: "[1.0, 0.2]",
  },
  Logistic: {
    label: "L/(1+e^{-k(x-x0)})",
    paramNames: ["L", "k", "x0"],
    truth: [10, 1.2, 5],
    init: (xs, ys) => [Math.max(...ys) * 0.7, 0.5, (Math.min(...xs) + Math.max(...xs)) / 2],
    f: (p, x) => p[0] / (1 + Math.exp(-p[1] * (x - p[2]))),
    xrange: [0, 10],
    tex: (p) => `y = \\dfrac{${fmt(p[0])}}{1+e^{-${fmt(p[1])}(x-${fmt(p[2])})}}`,
    py: "return L / (1 + np.exp(-k * (x - x0)))",
    p0: "[max(y), 0.5, np.median(x)]",
  },
  Gaussian: {
    label: "a·e^{-(x-μ)²/2σ²}",
    paramNames: ["a", "μ", "σ"],
    truth: [8, 0.5, 1.5],
    init: (xs, ys) => { const i = ys.indexOf(Math.max(...ys)); return [Math.max(...ys), xs[i] ?? 0, 1]; },
    f: (p, x) => p[0] * Math.exp(-((x - p[1]) ** 2) / (2 * p[2] * p[2])),
    xrange: [-5, 5],
    tex: (p) => `y = ${fmt(p[0])}\\,e^{-(x-${fmt(p[1])})^2/2\\,(${fmt(p[2])})^2}`,
    py: "return a * np.exp(-((x - mu) ** 2) / (2 * sigma ** 2))",
    p0: "[max(y), x[np.argmax(y)], 1.0]",
  },
  Power: {
    label: "a·x^b",
    paramNames: ["a", "b"],
    truth: [3, 1.4],
    init: () => [1, 1],
    f: (p, x) => p[0] * Math.pow(x, p[1]),
    xrange: [0.3, 5],
    tex: (p) => `y = ${fmt(p[0])}\\,x^{${fmt(p[1])}}`,
    py: "return a * np.power(x, b)",
    p0: "[1.0, 1.0]",
  },
  Sinusoid: {
    label: "a·sin(bx+c)",
    paramNames: ["a", "b", "c"],
    truth: [5, 1, 0.5],
    init: (_xs, ys) => [(Math.max(...ys) - Math.min(...ys)) / 2, 1, 0],
    f: (p, x) => p[0] * Math.sin(p[1] * x + p[2]),
    xrange: [0, 9.4],
    tex: (p) => `y = ${fmt(p[0])}\\sin(${fmt(p[1])}\\,x+${fmt(p[2])})`,
    py: "return a * np.sin(b * x + c)",
    p0: "[(max(y)-min(y))/2, 1.0, 0.0]",
  },
};

// Deterministic PRNG (mulberry32) so a given seed + controls reproduces the same
// noisy dataset — the page is then linkable and its fit is reproducible.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Standard normal via Box–Muller.
function gauss(r: () => number) {
  const u = Math.max(r(), 1e-12), v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Solve A x = b (n ≤ 3) by Gaussian elimination with partial pivoting + back
// substitution. Row swaps also swap the augmented column, so x is correctly indexed.
// Returns null if singular.
function solve(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < 1e-14) return null;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = s / M[i][i];
  }
  return x;
}

// Gauss–Newton with Levenberg–Marquardt damping. Jacobian is computed numerically
// (central differences). Returns the per-iteration parameter + RMSE history so the
// UI can animate convergence.
function fit(model: Model, xs: number[], ys: number[]) {
  const m = xs.length;
  const n = model.truth.length;
  let p = model.init(xs, ys);
  let lambda = 1e-2;
  const sse = (pp: number[]) => { let s = 0; for (let i = 0; i < m; i++) { const e = ys[i] - model.f(pp, xs[i]); s += e * e; } return s; };
  const rmseOf = (pp: number[]) => Math.sqrt(sse(pp) / m);
  let cost = sse(p);
  const history: number[][] = [p.slice()];
  const rmseHist: number[] = [rmseOf(p)];
  let iters = 0;

  for (let it = 0; it < 100; it++) {
    // Residuals r = y - f(p) and numerical Jacobian J_ij = ∂f/∂p_j.
    const J: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
    const r = new Array(m);
    for (let i = 0; i < m; i++) {
      r[i] = ys[i] - model.f(p, xs[i]);
      for (let j = 0; j < n; j++) {
        const h = 1e-6 * Math.max(Math.abs(p[j]), 1e-3);
        const pp = p.slice(); pp[j] += h;
        const pm = p.slice(); pm[j] -= h;
        J[i][j] = (model.f(pp, xs[i]) - model.f(pm, xs[i])) / (2 * h);
      }
    }
    // Normal equations JᵀJ and Jᵀr.
    const JtJ: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    const Jtr = new Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) { let s = 0; for (let i = 0; i < m; i++) s += J[i][j] * J[i][k]; JtJ[j][k] = s; }
      let s2 = 0; for (let i = 0; i < m; i++) s2 += J[i][j] * r[i]; Jtr[j] = s2;
    }
    // LM damping on the diagonal: (JᵀJ + λ·diag(JᵀJ)) Δβ = Jᵀr.
    const Adamp = JtJ.map((row, j) => row.map((val, k) => (k === j ? val * (1 + lambda) : val)));
    const delta = solve(Adamp, Jtr);
    if (!delta) break;
    const pNew = p.map((v, j) => v + delta[j]);
    const costNew = sse(pNew);
    iters = it + 1;
    if (Number.isFinite(costNew) && costNew < cost) {
      const improved = (cost - costNew) / (cost || 1);
      p = pNew; cost = costNew; lambda = Math.max(lambda * 0.6, 1e-9);
      history.push(p.slice()); rmseHist.push(rmseOf(p));
      const step = Math.sqrt(delta.reduce((a, v) => a + v * v, 0));
      if (improved < 1e-9 || step < 1e-9) break; // converged
    } else {
      lambda = Math.min(lambda * 4, 1e8); // reject step, damp harder
      if (lambda >= 1e8) break;
    }
  }

  // Goodness of fit.
  const meanY = ys.reduce((a, v) => a + v, 0) / m;
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < m; i++) { const e = ys[i] - model.f(p, xs[i]); ssRes += e * e; ssTot += (ys[i] - meanY) ** 2; }
  const r2 = 1 - ssRes / (ssTot || 1);
  const rmse = Math.sqrt(ssRes / m);
  return { params: p, history, rmseHist, iters, r2, rmse };
}

const PRESETS: Record<string, { noise: number; points: number }> = {
  "Clean data": { noise: 0.15, points: 40 },
  "Noisy": { noise: 0.9, points: 40 },
  "Sparse & noisy": { noise: 0.9, points: 10 },
  "Dense sample": { noise: 0.5, points: 80 },
};

export function CurveFittingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState("Logistic");
  const [{ noise, points, seed }, update] = useShareableNumbers({ noise: 0.6, points: 30, seed: 7 });
  const [tick, setTick] = useState(0);

  const M = MODELS[model];

  // Generate the noisy dataset and run the fit. Reproducible for a given seed.
  const result = useMemo(() => {
    const [x0, x1] = M.xrange;
    const npts = Math.round(points);
    const r = rng(Math.round(seed) * 100003 + model.length * 7 + npts);
    const trueYs: number[] = [];
    for (let i = 0; i < npts; i++) trueYs.push(M.f(M.truth, x0 + (x1 - x0) * (i / (npts - 1 || 1))));
    const amp = (Math.max(...trueYs) - Math.min(...trueYs)) || 1;
    const std = noise * amp * 0.12;
    const xs: number[] = [], ys: number[] = [];
    for (let i = 0; i < npts; i++) {
      const x = x0 + (x1 - x0) * (i / (npts - 1 || 1));
      xs.push(x);
      ys.push(M.f(M.truth, x) + gauss(r) * std);
    }
    const f = fit(M, xs, ys);
    return { xs, ys, ...f };
  }, [model, noise, points, seed, M]);

  // Restart the convergence animation whenever the problem changes.
  useEffect(() => { setTick(0); const id = setInterval(() => setTick((t) => t + 1), 90); return () => clearInterval(id); }, [model, noise, points, seed]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    const { xs, ys, history } = result;
    const [xLo, xHi] = M.xrange;
    // y-domain from data + true curve, padded.
    let yLo = Infinity, yHi = -Infinity;
    for (const y of ys) { if (y < yLo) yLo = y; if (y > yHi) yHi = y; }
    for (let i = 0; i <= 100; i++) { const y = M.f(M.truth, xLo + (xHi - xLo) * (i / 100)); if (y < yLo) yLo = y; if (y > yHi) yHi = y; }
    const yPad = (yHi - yLo) * 0.1 || 1; yLo -= yPad; yHi += yPad;
    const sx = (x: number) => PAD + ((x - xLo) / (xHi - xLo)) * (W - 2 * PAD);
    const sy = (y: number) => H - PAD - ((y - yLo) / (yHi - yLo)) * (H - 2 * PAD);

    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // grid
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 1; ctx.font = "11px ui-monospace, monospace"; ctx.fillStyle = "#475569";
    for (let i = 0; i <= 8; i++) {
      const gx = PAD + (i / 8) * (W - 2 * PAD);
      ctx.beginPath(); ctx.moveTo(gx, PAD); ctx.lineTo(gx, H - PAD); ctx.stroke();
      ctx.fillText((xLo + (i / 8) * (xHi - xLo)).toFixed(1), gx - 8, H - PAD + 16);
    }
    for (let i = 0; i <= 6; i++) {
      const gy = PAD + (i / 6) * (H - 2 * PAD);
      ctx.beginPath(); ctx.moveTo(PAD, gy); ctx.lineTo(W - PAD, gy); ctx.stroke();
      ctx.fillText((yHi - (i / 6) * (yHi - yLo)).toFixed(1), 4, gy + 4);
    }
    // axes
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(PAD, PAD); ctx.lineTo(PAD, H - PAD); ctx.lineTo(W - PAD, H - PAD); ctx.stroke();

    // true curve (faint dashed)
    ctx.setLineDash([5, 5]); ctx.strokeStyle = "rgba(148,163,184,0.45)"; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i <= 200; i++) { const x = xLo + (xHi - xLo) * (i / 200); const px = sx(x), py = sy(M.f(M.truth, x)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke(); ctx.setLineDash([]);

    // data points
    ctx.fillStyle = "#a3e635";
    for (let i = 0; i < xs.length; i++) { ctx.beginPath(); ctx.arc(sx(xs[i]), sy(ys[i]), 3.2, 0, 7); ctx.fill(); }

    // fitted curve at current animation step
    const step = Math.min(tick, history.length - 1);
    const p = history[step];
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let i = 0; i <= 200; i++) { const x = xLo + (xHi - xLo) * (i / 200); const px = sx(x), py = sy(M.f(p, x)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();

    // legend
    ctx.font = "12px ui-sans-serif, system-ui"; ctx.textBaseline = "middle";
    ctx.strokeStyle = "rgba(148,163,184,0.6)"; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(W - 150, 22); ctx.lineTo(W - 128, 22); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.fillText("true model", W - 122, 22);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(W - 150, 40); ctx.lineTo(W - 128, 40); ctx.stroke();
    ctx.fillStyle = "#22d3ee"; ctx.fillText("fitted", W - 122, 40);
    ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(W - 139, 58, 3.2, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.fillText("noisy data", W - 122, 58);
  }, [result, tick, M]);

  const total = result.history.length - 1;
  const step = Math.min(tick, total);
  const liveRmse = result.rmseHist[step];

  const explain =
    `Nonlinear least squares has no closed-form solution like a straight-line fit — the ${model.toLowerCase()} model is nonlinear in its parameters, so PolySim iterates with Gauss–Newton, linearizing the model at each step via the Jacobian. ` +
    (result.r2 >= 0.9
      ? `Here it converged in ${result.iters} iterations to R² = ${fmt(result.r2)}, a strong fit. `
      : `Here it reached R² = ${fmt(result.r2)} after ${result.iters} iterations. `) +
    `Because it is iterative, the result depends on the starting guess: a poor initial guess can send it toward a bad local minimum or fail to converge.`;

  const code = `import numpy as np
from scipy.optimize import curve_fit

# Noisy samples (x, y)
x = np.array([${result.xs.map((v) => fmt(v, 4)).join(", ")}])
y = np.array([${result.ys.map((v) => fmt(v, 4)).join(", ")}])

# ${model} model: ${M.label}
def model(x, ${M.paramNames.map((n) => (n === "μ" ? "mu" : n === "σ" ? "sigma" : n === "x0" ? "x0" : n)).join(", ")}):
    ${M.py}

p0 = ${M.p0}
popt, pcov = curve_fit(model, x, y, p0=p0, maxfev=10000)
print("fitted params:", popt)

resid = y - model(x, *popt)
ss_res = np.sum(resid ** 2)
ss_tot = np.sum((y - np.mean(y)) ** 2)
print("R^2 :", 1 - ss_res / ss_tot)
print("RMSE:", np.sqrt(np.mean(resid ** 2)))`;

  return (
    <StudioChrome title="Curve Fitting Studio" tagline="nonlinear least squares by Gauss–Newton"
      controls={<div>
        <div className="mb-3 grid grid-cols-2 gap-1.5">{Object.keys(MODELS).map((s) => <button key={s} onClick={() => setModel(s)} className={`rounded-lg px-2 py-1 text-xs font-semibold ${model === s ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{s}</button>)}</div>
        <p className="mb-3 text-xs text-slate-500">Fit a nonlinear model to noisy data. Gauss–Newton iterates from a starting guess, minimizing squared residuals. Watch the cyan curve snap onto the points.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Noise level" value={noise} min={0} max={2} step={0.05} onChange={(v) => update({ noise: v })} />
        <Slider label="Number of points" value={points} min={8} max={80} step={1} onChange={(v) => update({ points: v })} />
        <button onClick={() => update({ seed: Math.floor(Math.random() * 100000) })} className="mb-1 w-full rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300">↻ New random sample</button>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Model" value={model} />
        <Stat label="Iteration" value={`${step}/${total}`} />
        <Stat label="RMSE (live)" value={fmt(liveRmse, 4)} />
        <Stat label="R²" value={fmt(result.r2, 4)} />
        <Stat label="Iterations" value={String(result.iters)} />
        <p className="mb-1 mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">Fitted parameters</p>
        {M.paramNames.map((nm, i) => <Stat key={nm} label={`${nm} (true ${fmt(M.truth[i])})`} value={fmt(result.params[i])} />)}
        <Equation tex={M.tex(result.params)} label="Fitted model" />
        <Equation tex={`\\Delta\\beta = (J^{\\top}J)^{-1}J^{\\top}r`} label="Gauss–Newton update" />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
