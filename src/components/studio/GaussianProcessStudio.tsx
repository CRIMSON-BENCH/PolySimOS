"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useCanvasDrag, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 460, PAD = 38;
const X_MIN = 0, X_MAX = 10, Y_MIN = -2.6, Y_MAX = 2.6;

// data <-> pixel mapping
const px = (x: number) => PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD);
const py = (y: number) => H - PAD - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (H - 2 * PAD);
const invX = (p: number) => X_MIN + ((p - PAD) / (W - 2 * PAD)) * (X_MAX - X_MIN);
const invY = (p: number) => Y_MIN + ((H - PAD - p) / (H - 2 * PAD)) * (Y_MAX - Y_MIN);

type Pt = [number, number];

// ---- deterministic RNG so posterior samples don't flicker on redraw ----
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function randn(rng: () => number) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---- linear algebra (no libs) ----
// Cholesky: A = L Lᵀ (lower). Jittered sqrt guards near-singular kernels.
function cholesky(A: number[], n: number): number[] {
  const L = new Array(n * n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = 0;
      for (let k = 0; k < j; k++) s += L[i * n + k] * L[j * n + k];
      if (i === j) L[i * n + j] = Math.sqrt(Math.max(A[i * n + i] - s, 1e-12));
      else L[i * n + j] = (A[i * n + j] - s) / (L[j * n + j] || 1e-12);
    }
  }
  return L;
}
// Solve L y = b (L lower triangular).
function forwardSolve(L: number[], n: number, b: number[]): number[] {
  const y = new Array(n);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= L[i * n + k] * y[k];
    y[i] = s / (L[i * n + i] || 1e-12);
  }
  return y;
}
// Solve Lᵀ x = y (L lower triangular).
function backSolve(L: number[], n: number, y: number[]): number[] {
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i];
    for (let k = i + 1; k < n; k++) s -= L[k * n + i] * x[k];
    x[i] = s / (L[i * n + i] || 1e-12);
  }
  return x;
}

const M = 110; // test-grid resolution for mean / band / samples
const XS = Array.from({ length: M }, (_, i) => X_MIN + (i / (M - 1)) * (X_MAX - X_MIN));

function computeGP(points: Pt[], ell: number, sf2: number, sn: number) {
  const n = points.length;
  const k = (a: number, b: number) => sf2 * Math.exp(-((a - b) ** 2) / (2 * ell * ell));

  let L: number[] | null = null, alpha: number[] | null = null, logML: number | null = null;
  if (n > 0) {
    const K = new Array(n * n);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        let v = k(points[i][0], points[j][0]);
        if (i === j) v += sn * sn + 1e-9; // noise + tiny jitter
        K[i * n + j] = v;
      }
    L = cholesky(K, n);
    const y = points.map((p) => p[1]);
    alpha = backSolve(L, n, forwardSolve(L, n, y)); // (K+σ_n²I)⁻¹ y
    let dot = 0; for (let i = 0; i < n; i++) dot += y[i] * alpha[i];
    let logdet = 0; for (let i = 0; i < n; i++) logdet += Math.log(L[i * n + i]);
    logML = -0.5 * dot - logdet - 0.5 * n * Math.log(2 * Math.PI);
  }

  const mean = new Array(M), sd = new Array(M);
  const Vcols: (number[] | null)[] = [];
  for (let i = 0; i < M; i++) {
    const xs = XS[i];
    if (n > 0 && L && alpha) {
      const ks = new Array(n);
      for (let j = 0; j < n; j++) ks[j] = k(xs, points[j][0]);
      let mu = 0; for (let j = 0; j < n; j++) mu += ks[j] * alpha[j];
      const v = forwardSolve(L, n, ks);
      let vv = 0; for (let j = 0; j < n; j++) vv += v[j] * v[j];
      mean[i] = mu;
      sd[i] = Math.sqrt(Math.max(sf2 - vv, 1e-9)); // posterior std of the latent function
      Vcols.push(v);
    } else {
      mean[i] = 0; sd[i] = Math.sqrt(sf2); Vcols.push(null); // prior
    }
  }

  // Posterior covariance among test points  C = Kss - VᵀV, then sample f = mean + chol(C)·z.
  const C = new Array(M * M);
  for (let i = 0; i < M; i++)
    for (let j = 0; j <= i; j++) {
      let v = k(XS[i], XS[j]);
      if (n > 0) {
        const vi = Vcols[i]!, vj = Vcols[j]!;
        let s = 0; for (let t = 0; t < n; t++) s += vi[t] * vj[t];
        v -= s;
      }
      C[i * M + j] = v; C[j * M + i] = v;
    }
  for (let i = 0; i < M; i++) C[i * M + i] += 1e-6;
  const Lc = cholesky(C, M);
  const rng = mulberry32(1337);
  const samples: number[][] = [];
  for (let s = 0; s < 3; s++) {
    const z = new Array(M); for (let i = 0; i < M; i++) z[i] = randn(rng);
    const f = new Array(M);
    for (let i = 0; i < M; i++) {
      let acc = 0;
      for (let jj = 0; jj <= i; jj++) acc += Lc[i * M + jj] * z[jj];
      f[i] = mean[i] + acc;
    }
    samples.push(f);
  }

  return { mean, sd, samples, logML };
}

const PRESETS: Record<string, Pt[]> = {
  Sine: Array.from({ length: 9 }, (_, i): Pt => [i + 1, 1.6 * Math.sin((i + 1) * 0.8)]),
  Step: [[1, -1.2], [2, -1.2], [3, -1.15], [4, -1.2], [6, 1.2], [7, 1.15], [8, 1.2], [9, 1.2]],
  Sparse: [[1.5, 0.9], [5, -1.4], [8.5, 1.0]],
};

export function GaussianProcessStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Pt[]>(PRESETS.Sine);
  const [{ ell, sigmaF2, sigmaN }, update] = useShareableNumbers({ ell: 1, sigmaF2: 1, sigmaN: 0.12 });
  const dragIdx = useRef(-1);
  const didDrag = useRef(false);

  useCanvasDrag(canvasRef, W, H, {
    pick: (x, y) => {
      didDrag.current = false;
      let best = -1, bestD = 16;
      for (let i = 0; i < points.length; i++) {
        const d = Math.hypot(px(points[i][0]) - x, py(points[i][1]) - y);
        if (d < bestD) { bestD = d; best = i; }
      }
      dragIdx.current = best;
      return best >= 0;
    },
    move: (x, y) => {
      didDrag.current = true;
      const i = dragIdx.current;
      if (i < 0) return;
      const nx = Math.max(X_MIN, Math.min(X_MAX, invX(x)));
      const ny = Math.max(Y_MIN, Math.min(Y_MAX, invY(y)));
      setPoints((p) => p.map((q, k): Pt => (k === i ? [nx, ny] : q)));
    },
  });

  const gp = useMemo(() => computeGP(points, ell, sigmaF2, sigmaN), [points, ell, sigmaF2, sigmaN]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 1; ctx.beginPath();
    for (let gx = X_MIN; gx <= X_MAX; gx += 1) { ctx.moveTo(px(gx), py(Y_MIN)); ctx.lineTo(px(gx), py(Y_MAX)); }
    for (let gy = -2; gy <= 2; gy += 1) { ctx.moveTo(px(X_MIN), py(gy)); ctx.lineTo(px(X_MAX), py(gy)); }
    ctx.stroke();
    // zero axis
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(px(X_MIN), py(0)); ctx.lineTo(px(X_MAX), py(0)); ctx.stroke();

    const { mean, sd, samples } = gp;

    // 95% confidence band (mean ± 1.96σ)
    ctx.fillStyle = "rgba(34,211,238,0.16)";
    ctx.beginPath();
    for (let i = 0; i < M; i++) { const p = [px(XS[i]), py(mean[i] + 1.96 * sd[i])]; i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    for (let i = M - 1; i >= 0; i--) ctx.lineTo(px(XS[i]), py(mean[i] - 1.96 * sd[i]));
    ctx.closePath(); ctx.fill();

    // posterior sample functions
    const sampleColors = ["rgba(163,230,53,0.55)", "rgba(192,132,252,0.55)", "rgba(244,114,182,0.55)"];
    ctx.lineWidth = 1.25;
    samples.forEach((f, s) => {
      ctx.strokeStyle = sampleColors[s % sampleColors.length];
      ctx.beginPath();
      for (let i = 0; i < M; i++) { const X = px(XS[i]), Y = py(f[i]); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke();
    });

    // posterior mean
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let i = 0; i < M; i++) { const X = px(XS[i]), Y = py(mean[i]); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
    ctx.stroke();

    // training points
    for (const [x, y] of points) {
      ctx.fillStyle = "#a3e635"; ctx.strokeStyle = "#022c22"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px(x), py(y), 5.5, 0, 7); ctx.fill(); ctx.stroke();
    }

    // labels
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif";
    ctx.fillText("click empty space to add a point · drag a point to move it", 12, 20);
    ctx.fillText(`${points.length} training points · ℓ=${ell.toFixed(2)}`, 12, H - 12);
  }, [gp, points, ell, sigmaF2, sigmaN]);

  const applyPreset = (label: string) => { setPoints(PRESETS[label].map((p) => [...p] as Pt)); };

  const explain =
    points.length === 0
      ? "With no data, the GP shows its prior: mean zero everywhere and a constant uncertainty band of width set by the signal variance. The sample curves are draws from that prior distribution over functions."
      : ell <= 0.5
      ? `A short length-scale (ℓ=${ell.toFixed(2)}) means points only influence their immediate neighbourhood, so the mean wiggles sharply and the band snaps back to wide between points — the model assumes the function can change fast.`
      : ell >= 2
      ? `A long length-scale (ℓ=${ell.toFixed(2)}) makes each point influence a wide region, so the mean is very smooth and the band stays narrow across gaps — the model assumes the function changes slowly.`
      : `The posterior mean interpolates the ${points.length} points and the 95% band collapses at each observation (up to the noise σ_n=${sigmaN.toFixed(2)}) and widens in the gaps between them — that widening is the model honestly reporting where it has no evidence.`;

  const code = `import numpy as np
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF, ConstantKernel as C, WhiteKernel

X = np.array([${points.map((p) => p[0].toFixed(2)).join(", ")}]).reshape(-1, 1)
y = np.array([${points.map((p) => p[1].toFixed(2)).join(", ")}])

# k(x, x') = σ_f² exp(-(x - x')² / 2ℓ²)  + noise
kernel = C(${sigmaF2.toFixed(2)}) * RBF(length_scale=${ell.toFixed(2)}) + WhiteKernel(${(sigmaN * sigmaN).toFixed(4)})
gp = GaussianProcessRegressor(kernel=kernel, optimizer=None)  # keep our hyperparameters fixed
gp.fit(X, y)

xs = np.linspace(${X_MIN}, ${X_MAX}, 200).reshape(-1, 1)
mean, std = gp.predict(xs, return_std=True)   # posterior mean and std
lo, hi = mean - 1.96 * std, mean + 1.96 * std  # 95% confidence band
print("log marginal likelihood:", gp.log_marginal_likelihood_value_)`;

  return (
    <StudioChrome title="Gaussian Process Studio" tagline="Bayesian regression with uncertainty"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">A Gaussian process fits a whole distribution over functions to your data. Click the canvas to add training points, or drag them around, and watch the posterior mean, 95% band, and sample functions update live.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label, hint: `Load the ${label} demo dataset` }))}
          onApply={applyPreset}
        />
        <div className="mb-3 flex gap-1.5">
          <button onClick={() => setPoints([])} className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300">Clear points</button>
        </div>
        <Slider label="Length-scale ℓ (wiggliness)" value={ell} min={0.2} max={3} step={0.05} onChange={(v) => update({ ell: v })} />
        <Slider label="Signal variance σ²" value={sigmaF2} min={0.1} max={3} step={0.05} onChange={(v) => update({ sigmaF2: v })} />
        <Slider label="Noise σ_n" value={sigmaN} min={0.01} max={1} step={0.01} onChange={(v) => update({ sigmaN: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Training points" value={String(points.length)} />
        <Stat label="Length-scale ℓ" value={ell.toFixed(2)} />
        <Stat label="Signal var σ²" value={sigmaF2.toFixed(2)} />
        <Stat label="Noise σ_n" value={sigmaN.toFixed(2)} />
        <Stat label="Log marginal lik." value={gp.logML === null ? "—" : gp.logML.toFixed(1)} />
        <Equation tex={`\\begin{aligned}k(x,x') &= \\sigma_f^2\\,e^{-(x-x')^2/2\\ell^2}\\\\ m(x_*) &= k_*^{\\top}(K+\\sigma_n^2 I)^{-1}y\\\\ \\mathbb{V}[x_*] &= k(x_*,x_*)-k_*^{\\top}(K+\\sigma_n^2 I)^{-1}k_*\\end{aligned}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} onClick={(e) => {
        if (didDrag.current) { didDrag.current = false; return; } // a drag just ended
        if (dragIdx.current >= 0) { dragIdx.current = -1; return; } // clicked on an existing point
        const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const x = invX((e.clientX - r.left) * W / r.width);
        const y = invY((e.clientY - r.top) * H / r.height);
        if (x < X_MIN || x > X_MAX || y < Y_MIN || y > Y_MAX) return;
        if (points.length >= 40) return;
        setPoints((p) => [...p, [x, y] as Pt]);
      }} className="h-auto w-full cursor-crosshair rounded-lg" /></StudioChrome>
  );
}
