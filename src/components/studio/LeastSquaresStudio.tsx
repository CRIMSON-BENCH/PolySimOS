"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useCanvasDrag } from "@/lib/studioKit";

const W = 760, H = 480, PAD = 46;

// World domain is [0,10] x [0,10]. Map world <-> canvas pixels.
const toPx = (x: number) => PAD + (x / 10) * (W - 2 * PAD);
const toPy = (y: number) => H - PAD - (y / 10) * (H - 2 * PAD);
const toWorldX = (px: number) => ((px - PAD) / (W - 2 * PAD)) * 10;
const toWorldY = (py: number) => ((H - PAD - py) / (H - 2 * PAD)) * 10;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Pt = [number, number];

const PRESETS: Record<string, Pt[]> = {
  "Linear trend": [[0.6, 1.5], [1.5, 2.4], [2.3, 2.7], [3.2, 3.9], [4.1, 4.0], [5.0, 5.2], [5.9, 5.6], [6.8, 6.7], [7.7, 6.9], [9.0, 8.5]],
  Noisy: [[0.6, 6.2], [1.5, 3.8], [2.3, 5.9], [3.2, 4.1], [4.1, 7.0], [5.0, 3.2], [5.9, 6.5], [6.8, 4.8], [7.7, 5.5], [9.0, 4.3]],
  Quadratic: [[0.6, 6.4], [1.5, 4.6], [2.3, 3.3], [3.2, 2.2], [4.1, 1.6], [5.0, 1.5], [5.9, 1.9], [6.8, 2.6], [7.7, 3.9], [9.0, 6.4]],
  Outlier: [[0.6, 1.6], [1.5, 2.3], [2.3, 2.9], [3.2, 3.5], [4.1, 4.3], [5.0, 9.2], [5.9, 5.8], [6.8, 6.5], [7.7, 7.1], [9.0, 8.3]],
};

// Solve A x = b (n x n) by Gauss-Jordan elimination with partial pivoting. No libs.
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col];
    if (Math.abs(d) < 1e-12) continue;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / d;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row, i) => (Math.abs(row[i]) < 1e-12 ? 0 : row[n] / row[i]));
}

// Fit a degree-`deg` polynomial via the normal equations (XᵀX)β = Xᵀy.
// Returns coefficients in ASCENDING order: β0 + β1 x + β2 x² + ...
function polyfit(pts: Pt[], deg: number): number[] {
  const m = pts.length;
  const powerSums = new Array(2 * deg + 1).fill(0); // Σ x^k, k = 0..2deg  → entries of XᵀX
  const rhs = new Array(deg + 1).fill(0); // Σ y x^k → entries of Xᵀy
  for (let i = 0; i < m; i++) {
    const [x, y] = pts[i];
    let xp = 1;
    for (let k = 0; k <= 2 * deg; k++) {
      powerSums[k] += xp;
      if (k <= deg) rhs[k] += y * xp;
      xp *= x;
    }
  }
  const n = deg + 1;
  const A: number[][] = [];
  for (let r = 0; r < n; r++) {
    A[r] = [];
    for (let c = 0; c < n; c++) A[r][c] = powerSums[r + c];
  }
  return solveLinearSystem(A, rhs);
}

const evalPoly = (coeffs: number[], x: number) => coeffs.reduce((acc, c, i) => acc + c * Math.pow(x, i), 0);

const polyStr = (c: number[]) => {
  let out = `ŷ = ${c[0].toFixed(2)}`;
  for (let i = 1; i < c.length; i++) {
    out += `${c[i] < 0 ? " − " : " + "}${Math.abs(c[i]).toFixed(3)}·x${i > 1 ? `^${i}` : ""}`;
  }
  return out;
};

export function LeastSquaresStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pts, setPts] = useState<Pt[]>(PRESETS["Linear trend"]);
  const [degree, setDegree] = useState(1);
  const dragIdx = useRef(-1);

  useCanvasDrag(canvasRef, W, H, {
    pick: (x, y) => {
      let best = -1, bd = 20 * 20;
      pts.forEach((p, i) => {
        const dx = toPx(p[0]) - x, dy = toPy(p[1]) - y;
        const d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = i; }
      });
      dragIdx.current = best;
      return best >= 0;
    },
    move: (x, y) => {
      if (dragIdx.current < 0) return;
      const wx = clamp(toWorldX(x), 0, 10), wy = clamp(toWorldY(y), 0, 10);
      setPts((prev) => prev.map((p, i) => (i === dragIdx.current ? [wx, wy] as Pt : p)));
    },
    up: () => { dragIdx.current = -1; },
  });

  const { coeffs, r2, rmse } = useMemo(() => {
    const c = polyfit(pts, degree);
    const ys = pts.map((p) => p[1]);
    const yMean = ys.reduce((a, b) => a + b, 0) / pts.length;
    let ssRes = 0, ssTot = 0;
    for (const [x, y] of pts) {
      const yh = evalPoly(c, x);
      ssRes += (y - yh) ** 2;
      ssTot += (y - yMean) ** 2;
    }
    return { coeffs: c, r2: ssTot < 1e-12 ? 1 : 1 - ssRes / ssTot, rmse: Math.sqrt(ssRes / pts.length) };
  }, [pts, degree]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, W, H);

    // grid + axes
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#475569";
    ctx.font = "10px sans-serif";
    for (let g = 0; g <= 10; g++) {
      const gx = toPx(g), gy = toPy(g);
      ctx.beginPath(); ctx.moveTo(gx, toPy(0)); ctx.lineTo(gx, toPy(10)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(toPx(0), gy); ctx.lineTo(toPx(10), gy); ctx.stroke();
    }
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(toPx(0), toPy(0)); ctx.lineTo(toPx(10), toPy(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(toPx(0), toPy(0)); ctx.lineTo(toPx(0), toPy(10)); ctx.stroke();

    // residual segments (point → curve)
    ctx.strokeStyle = "rgba(244,114,182,0.7)";
    ctx.lineWidth = 1.5;
    for (const [x, y] of pts) {
      ctx.beginPath();
      ctx.moveTo(toPx(x), toPy(y));
      ctx.lineTo(toPx(x), toPy(evalPoly(coeffs, x)));
      ctx.stroke();
    }

    // fitted curve (clipped to plot area)
    ctx.save();
    ctx.beginPath();
    ctx.rect(toPx(0), toPy(10), toPx(10) - toPx(0), toPy(0) - toPy(10));
    ctx.clip();
    ctx.strokeStyle = "#a3e635";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    for (let px = toPx(0); px <= toPx(10); px += 2) {
      const py = toPy(evalPoly(coeffs, toWorldX(px)));
      if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    // data points
    for (const [x, y] of pts) {
      ctx.fillStyle = "#22d3ee";
      ctx.beginPath(); ctx.arc(toPx(x), toPy(y), 6, 0, 7); ctx.fill();
      ctx.strokeStyle = "#020617"; ctx.lineWidth = 1.5; ctx.stroke();
    }

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.fillText(`degree ${degree} fit  ·  R² = ${r2.toFixed(3)}  ·  RMSE = ${rmse.toFixed(2)}`, toPx(0) + 4, 20);
    ctx.fillText("drag any point to reshape the data", toPx(0) + 4, H - 12);
  }, [pts, degree, coeffs, r2, rmse]);

  const explain =
    degree >= 4
      ? `Least squares picks the coefficients that minimize Σ(yᵢ − ŷᵢ)² — the total squared length of the pink residual segments. At degree ${degree} the curve has enough freedom to weave through nearly every point (R² = ${r2.toFixed(3)}), but that flexibility fits the noise rather than the trend. This is overfitting: R² keeps climbing toward 1 while predictions between the points get wilder and less reliable.`
      : `Least squares picks the coefficients that minimize Σ(yᵢ − ŷᵢ)² — the total squared length of the pink residual segments. Solving the normal equations (XᵀX)β = Xᵀy yields that minimum directly, no iteration. This degree-${degree} fit explains R² = ${r2.toFixed(3)} of the variance (RMSE ${rmse.toFixed(2)}). Raise the degree to bend the curve — but push it too high and it starts chasing noise instead of the underlying trend.`;

  const code = `import numpy as np

# data points (x, y) — matches the studio canvas
x = np.array([${pts.map((p) => p[0].toFixed(2)).join(", ")}])
y = np.array([${pts.map((p) => p[1].toFixed(2)).join(", ")}])
deg = ${degree}

# least-squares polynomial fit (np.polyfit uses lstsq under the hood)
beta = np.polyfit(x, y, deg)          # coeffs, highest power first
yhat = np.polyval(beta, x)

# equivalently, solve the normal equations yourself:
# X = np.vander(x, deg + 1)           # design matrix
# beta = np.linalg.lstsq(X, y, rcond=None)[0]
# beta = np.linalg.solve(X.T @ X, X.T @ y)

ss_res = np.sum((y - yhat) ** 2)
ss_tot = np.sum((y - y.mean()) ** 2)
r2 = 1 - ss_res / ss_tot
rmse = np.sqrt(ss_res / len(x))
print("coeffs (hi->lo):", beta)
print("R^2:", round(r2, 4), " RMSE:", round(rmse, 4))`;

  return (
    <StudioChrome title="Least Squares Studio" tagline="polynomial regression via normal equations"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Drag any point to reshape the cloud and watch the best-fit curve re-solve instantly. Pink segments are the residuals least squares minimizes; raise the degree to bend the curve — and to see overfitting.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => setPts(PRESETS[label])}
        />
        <Slider label="Polynomial degree" value={degree} min={1} max={5} step={1} onChange={(v) => setDegree(Math.round(v))} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="R²" value={r2.toFixed(4)} />
        <Stat label="RMSE" value={rmse.toFixed(3)} />
        <Stat label="Degree" value={String(degree)} />
        <Stat label="Data points" value={String(pts.length)} />
        <Stat label="Method" value="normal equations" />
        <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white/60 p-2 font-mono text-[11px] text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">{polyStr(coeffs)}</div>
        <Equation tex={`\\hat\\beta = (X^{\\top}X)^{-1}X^{\\top}y \\qquad R^2 = 1 - \\dfrac{\\sum_i (y_i-\\hat y_i)^2}{\\sum_i (y_i-\\bar y)^2} = ${r2.toFixed(3)}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
