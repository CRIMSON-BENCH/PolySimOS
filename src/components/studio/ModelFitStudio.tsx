"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { ExplainResult } from "./SolverExtras";
import { Equation } from "./Equation";
import Link from "next/link";
import { hidpi, PALETTE, copyText } from "@/lib/studioKit";

const CW = 760, CH = 420;

type Pt = { x: number; y: number };
type Model = {
  key: string; name: string; params: string[];
  init: (d: Pt[]) => number[];
  f: (x: number, b: number[]) => number;
  latex: (b: number[]) => string;
  bounds?: (d: Pt[]) => [number[], number[]];       // per-param [lo, hi] clamps
  grid?: (d: Pt[]) => { i: number; values: number[] }; // coarse search over one param (e.g. dead time)
};

const MODELS: Model[] = [
  {
    key: "linear", name: "Linear a+bx", params: ["a", "b"],
    init: () => [0, 1], f: (x, b) => b[0] + b[1] * x,
    latex: (b) => `y = ${b[0].toFixed(3)} + ${b[1].toFixed(3)}\\,x`,
  },
  {
    key: "expdecay", name: "Exponential a·e^{bx}", params: ["a", "b"],
    init: (d) => [d[0]?.y || 1, -0.1], f: (x, b) => b[0] * Math.exp(b[1] * x),
    latex: (b) => `y = ${b[0].toFixed(3)}\\,e^{${b[1].toFixed(3)}x}`,
  },
  {
    key: "fostep", name: "First-order step K(1−e^{−x/τ})", params: ["K", "tau"],
    init: (d) => [d[d.length - 1]?.y || 1, (d[d.length - 1]?.x || 1) / 3], f: (x, b) => b[0] * (1 - Math.exp(-x / Math.max(1e-3, b[1]))),
    latex: (b) => `y = ${b[0].toFixed(3)}\\left(1-e^{-x/${b[1].toFixed(3)}}\\right)`,
  },
  {
    key: "fopdt", name: "First-order + dead time (FOPDT)", params: ["K", "tau", "theta"],
    init: (d) => [d[d.length - 1]?.y || 1, (d[d.length - 1]?.x || 3) / 3, 0],
    f: (x, b) => (x <= b[2] ? 0 : b[0] * (1 - Math.exp(-(x - b[2]) / Math.max(1e-3, b[1])))),
    latex: (b) => `y = ${b[0].toFixed(2)}\\left(1-e^{-(x-${b[2].toFixed(2)})/${b[1].toFixed(2)}}\\right),\\ x>${b[2].toFixed(2)}`,
    bounds: (d) => { const xm = Math.max(...d.map((p) => p.x)); return [[1e-3, 0.05, 0], [1e6, 1e6, xm * 0.9]]; },
    grid: (d) => { const xm = Math.max(...d.map((p) => p.x)); return { i: 2, values: Array.from({ length: 13 }, (_, k) => (k / 12) * xm * 0.6) }; },
  },
  {
    key: "so2", name: "Second-order underdamped step", params: ["K", "omega", "zeta"],
    init: (d) => [d[d.length - 1]?.y || 1, 2, 0.4],
    f: (x, b) => { const z = b[2], w = b[1]; if (z >= 1) return b[0] * (1 - Math.exp(-w * x) * (1 + w * x)); const wd = w * Math.sqrt(1 - z * z); return b[0] * (1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + (z * w / wd) * Math.sin(wd * x))); },
    latex: (b) => `K=${b[0].toFixed(2)},\\ \\omega=${b[1].toFixed(2)},\\ \\zeta=${b[2].toFixed(2)}`,
    bounds: () => [[1e-3, 0.05, 0.02], [1e6, 50, 0.99]],
  },
  {
    key: "logistic", name: "Logistic L/(1+e^{−k(x−x₀)})", params: ["L", "k", "x0"],
    init: (d) => [Math.max(...d.map((p) => p.y)) || 1, 1, (d[0]?.x + d[d.length - 1]?.x) / 2 || 0], f: (x, b) => b[0] / (1 + Math.exp(-b[1] * (x - b[2]))),
    latex: (b) => `y = \\dfrac{${b[0].toFixed(2)}}{1+e^{-${b[1].toFixed(3)}(x-${b[2].toFixed(2)})}}`,
  },
  {
    key: "power", name: "Power a·x^b", params: ["a", "b"],
    init: (d) => [d[0]?.y || 1, 1], f: (x, b) => b[0] * Math.pow(Math.max(1e-6, x), b[1]),
    latex: (b) => `y = ${b[0].toFixed(3)}\\,x^{${b[1].toFixed(3)}}`,
  },
];

// Gauss–Newton with numerical Jacobian + tiny Levenberg damping. Solves a small system.
function solveLin(A: number[][], b: number[]): number[] {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    if (Math.abs(M[c][c]) < 1e-12) M[c][c] = 1e-12;
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((_, i) => M[i][n] / M[i][i]); // fully reduced to diagonal above
}

function fitGN(model: Model, init: number[], data: Pt[]) {
  let beta = init.slice();
  const np = beta.length, h = 1e-5;
  const [lo, hi] = model.bounds ? model.bounds(data) : [[], []];
  let lambda = 1e-2;
  const sse = (b: number[]) => data.reduce((s, p) => { const e = p.y - model.f(p.x, b); return s + e * e; }, 0);
  for (let iter = 0; iter < 100; iter++) {
    const JtJ = Array.from({ length: np }, () => new Array(np).fill(0));
    const Jtr = new Array(np).fill(0);
    for (const p of data) {
      const r = p.y - model.f(p.x, beta);
      const J = beta.map((_, k) => { const bb = beta.slice(); bb[k] += h; return (model.f(p.x, bb) - model.f(p.x, beta)) / h; });
      for (let i = 0; i < np; i++) { Jtr[i] += J[i] * r; for (let j = 0; j < np; j++) JtJ[i][j] += J[i] * J[j]; }
    }
    for (let i = 0; i < np; i++) JtJ[i][i] *= (1 + lambda);
    let delta: number[];
    try { delta = solveLin(JtJ, Jtr); } catch { break; }
    let next = beta.map((v, i) => v + delta[i]);
    if (model.bounds) next = next.map((v, i) => Math.max(lo[i], Math.min(hi[i], v)));
    if (sse(next) < sse(beta)) { beta = next; lambda = Math.max(1e-7, lambda * 0.7); } else { lambda = Math.min(1e4, lambda * 2.5); }
    if (delta.every((d) => Math.abs(d) < 1e-9)) break;
  }
  const mean = data.reduce((s, p) => s + p.y, 0) / data.length;
  const ssTot = data.reduce((s, p) => s + (p.y - mean) ** 2, 0);
  const ssRes = sse(beta);
  return { beta, r2: ssTot > 0 ? 1 - ssRes / ssTot : 1, rmse: Math.sqrt(ssRes / data.length) };
}

function fit(model: Model, data: Pt[]) {
  const base = model.init(data);
  if (!model.grid) return fitGN(model, base, data);
  const { i, values } = model.grid(data);
  let best: ReturnType<typeof fitGN> | null = null;
  for (const v of values) { const init = base.slice(); init[i] = v; const r = fitGN(model, init, data); if (!best || r.r2 > best.r2) best = r; }
  return best ?? fitGN(model, base, data);
}

function demoData(): string {
  // Noisy first-order step response, as if logged from a real system.
  const K = 3.4, tau = 1.8; let out = "# t, y  (paste your own: x,y per line)\n";
  for (let t = 0; t <= 10; t += 0.5) { const y = K * (1 - Math.exp(-t / tau)) + (Math.random() - 0.5) * 0.35; out += `${t.toFixed(1)}, ${y.toFixed(3)}\n`; }
  return out;
}

function parse(text: string): Pt[] {
  return text.split(/\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split(/[,\s]+/).map(Number)).filter((a) => a.length >= 2 && a.every(Number.isFinite))
    .map((a) => ({ x: a[0], y: a[1] }));
}

export function ModelFitStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [raw, setRaw] = useState(demoData());
  const [modelKey, setModelKey] = useState("fostep");
  const [copied, setCopied] = useState(false);

  const data = useMemo(() => parse(raw), [raw]);
  const model = MODELS.find((m) => m.key === modelKey)!;
  const result = useMemo(() => (data.length >= model.params.length ? fit(model, data) : null), [data, model]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, CW, CH);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, CW, CH);
    if (!data.length) { ctx.fillStyle = "#64748b"; ctx.font = "13px sans-serif"; ctx.textAlign = "center"; ctx.fillText("Paste x,y data (or use demo data)", CW / 2, CH / 2); return; }
    const xs = data.map((p) => p.x), ys = data.map((p) => p.y);
    let xmin = Math.min(...xs), xmax = Math.max(...xs), ymin = Math.min(...ys), ymax = Math.max(...ys);
    const px = (xmax - xmin) * 0.05 || 1, py = (ymax - ymin) * 0.1 || 1; xmin -= px; xmax += px; ymin -= py; ymax += py;
    const X = (x: number) => 40 + ((x - xmin) / (xmax - xmin)) * (CW - 60);
    const Y = (y: number) => CH - 30 - ((y - ymin) / (ymax - ymin)) * (CH - 50);
    ctx.strokeStyle = "rgba(148,163,184,0.12)"; ctx.lineWidth = 1;
    for (let g = 0; g <= 5; g++) { const yy = 10 + (g / 5) * (CH - 40); ctx.beginPath(); ctx.moveTo(40, yy); ctx.lineTo(CW - 20, yy); ctx.stroke(); }
    // fitted curve
    if (result) {
      ctx.strokeStyle = PALETTE.series[0]; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const x = xmin + (i / 200) * (xmax - xmin); const yv = model.f(x, result.beta); i ? ctx.lineTo(X(x), Y(yv)) : ctx.moveTo(X(x), Y(yv)); }
      ctx.stroke();
    }
    // data points
    ctx.fillStyle = "#a3e635";
    for (const p of data) { ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 3, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#64748b"; ctx.font = "11px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`${data.length} measured points · fitted ${model.name}`, 44, 20);
  }, [data, result, model]);

  // FOPDT-based PID suggestion (IMC tuning) when the first-order model is chosen.
  const pidHint = useMemo(() => {
    if (!result) return null;
    if (modelKey === "fostep") { const [K, tau] = result.beta; if (K <= 0 || tau <= 0) return null; const lam = tau; const Kc = tau / (K * lam); return { Kp: Kc, Ki: Kc / tau, K, tau, theta: 0 }; }
    if (modelKey === "fopdt") { const [K, tau, theta] = result.beta; if (K <= 0 || tau <= 0) return null; const lam = Math.max(theta, 0.1 * tau); const Kc = tau / (K * (theta + lam)); const Ti = Math.min(tau, 4 * (theta + lam)); return { Kp: Kc, Ki: Kc / Ti, K, tau, theta }; }
    return null;
  }, [modelKey, result]);

  const explain = !result
    ? "Paste at least a few (x, y) points — one pair per line — or hit Demo data. Pick the model form that matches your system and PolySim identifies the parameters."
    : result.r2 > 0.95
    ? `Strong fit (R² = ${result.r2.toFixed(3)}): this model explains your data well. ${modelKey === "fostep" ? "You've identified the plant — send the K/τ to Controller → Code to tune a PID for your real system." : "Use these parameters as your validated model."}`
    : result.r2 > 0.7
    ? `Reasonable fit (R² = ${result.r2.toFixed(3)}), but the residuals suggest the model form may not fully capture the dynamics — try another model.`
    : `Weak fit (R² = ${result.r2.toFixed(3)}): this model form probably doesn't match your data. Try a different one.`;

  const paramText = result ? model.params.map((n, i) => `${n} = ${result.beta[i].toFixed(4)}`).join("\n") + `\nR² = ${result.r2.toFixed(4)}, RMSE = ${result.rmse.toFixed(4)}` : "";

  return (
    <StudioChrome
      title="Model Fit & Validate"
      tagline="fit a model to your real measured data"
      controls={
        <div>
          <p className="mb-2 text-xs text-slate-500">Paste your measurements (x,y per line) and identify a validated model — with R², residuals, and a handoff to controller design.</p>
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={7} spellCheck={false}
            className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300" />
          <div className="mt-2 mb-3 flex gap-2">
            <button onClick={() => setRaw(demoData())} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-cyan-400 dark:border-slate-700 dark:text-slate-300">↻ Demo data</button>
            <button onClick={async () => { setCopied(await copyText(paramText)); setTimeout(() => setCopied(false), 1500); }} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">{copied ? "Copied ✓" : "Copy model"}</button>
          </div>
          <label className="text-xs text-slate-500">Model form</label>
          <select value={modelKey} onChange={(e) => setModelKey(e.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950">
            {MODELS.map((m) => <option key={m.key} value={m.key}>{m.name}</option>)}
          </select>
          {pidHint && (
            <div className="mt-3 rounded-lg border border-cyan-300/40 bg-cyan-500/10 p-3 text-xs text-slate-700 dark:border-cyan-500/30 dark:text-slate-300">
              Identified plant K={pidHint.K.toFixed(2)}, τ={pidHint.tau.toFixed(2)}{pidHint.theta > 0 ? `, θ=${pidHint.theta.toFixed(2)}` : ""}. Suggested PID: Kp≈{pidHint.Kp.toFixed(2)}, Ki≈{pidHint.Ki.toFixed(2)}. <Link href="/studio/controller-code" className="font-semibold text-cyan-700 underline dark:text-cyan-400">Design & export it →</Link>
            </div>
          )}
        </div>
      }
      inspector={
        <div>
          <Stat label="Points" value={String(data.length)} />
          {result && model.params.map((n, i) => <Stat key={n} label={n} value={result.beta[i].toFixed(4)} />)}
          {result && <Stat label="R²" value={result.r2.toFixed(4)} />}
          {result && <Stat label="RMSE" value={result.rmse.toFixed(4)} />}
          {result && <Equation tex={model.latex(result.beta)} />}
          <ExplainResult text={explain} />
        </div>
      }
    >
      <canvas ref={canvasRef} width={CW} height={CH} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
