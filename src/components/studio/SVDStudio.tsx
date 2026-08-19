"use client";

import { useEffect, useMemo, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers, PALETTE } from "@/lib/studioKit";

const W = 760, H = 480;
const N = 64; // square test image (m = n = N)

// Build a small grayscale test image in [0,1]: a smooth gradient background (low-rank content)
// plus a sharp bright letter "P" (high-rank edges) so compression is visually meaningful.
function buildImage(): number[][] {
  const A: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      A[r][c] = 0.18 + 0.42 * (c / (N - 1)) + 0.12 * Math.sin((r / (N - 1)) * Math.PI);
    }
  }
  const fill = (r0: number, r1: number, c0: number, c1: number, v: number) => {
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) A[r][c] = v;
  };
  // draw a bright "P" (stem, top bar, mid bar, upper-right bowl)
  fill(12, 52, 16, 22, 0.95);
  fill(12, 18, 16, 40, 0.95);
  fill(30, 36, 16, 40, 0.95);
  fill(12, 36, 34, 40, 0.95);
  return A;
}

// Real SVD via one-sided Jacobi: rotate column pairs of A to orthogonalize them. On convergence the
// column norms are the singular values, normalized columns are U, and the accumulated rotations are V.
function svd(A: number[][]) {
  const m = N, n = N;
  const cols = Array.from({ length: n }, (_, j) => {
    const col = new Float64Array(m);
    for (let i = 0; i < m; i++) col[i] = A[i][j];
    return col;
  });
  const V = Array.from({ length: n }, (_, j) => {
    const col = new Float64Array(n);
    col[j] = 1;
    return col;
  });
  const eps = 1e-12;
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        const cp = cols[p], cq = cols[q];
        let alpha = 0, beta = 0, gamma = 0;
        for (let i = 0; i < m; i++) { alpha += cp[i] * cp[i]; beta += cq[i] * cq[i]; gamma += cp[i] * cq[i]; }
        off += gamma * gamma;
        if (Math.abs(gamma) <= eps * Math.sqrt(alpha * beta)) continue;
        const zeta = (beta - alpha) / (2 * gamma);
        const sgn = zeta >= 0 ? 1 : -1;
        const t = sgn / (Math.abs(zeta) + Math.sqrt(1 + zeta * zeta));
        const c = 1 / Math.sqrt(1 + t * t), s = c * t;
        for (let i = 0; i < m; i++) { const x = cp[i], y = cq[i]; cp[i] = c * x - s * y; cq[i] = s * x + c * y; }
        const vp = V[p], vq = V[q];
        for (let i = 0; i < n; i++) { const x = vp[i], y = vq[i]; vp[i] = c * x - s * y; vq[i] = s * x + c * y; }
      }
    }
    if (off < 1e-14) break;
  }
  // singular values = column norms; sort descending
  const modes = cols.map((col, j) => {
    let sq = 0;
    for (let i = 0; i < m; i++) sq += col[i] * col[i];
    return { sigma: Math.sqrt(sq), j };
  });
  modes.sort((a, b) => b.sigma - a.sigma);
  const sigma = modes.map((e) => e.sigma);
  const U = modes.map((e) => {
    const col = cols[e.j], sig = e.sigma || 1, u = new Float64Array(m);
    for (let i = 0; i < m; i++) u[i] = col[i] / sig;
    return u;
  });
  const Vt = modes.map((e) => V[e.j]); // each entry is the v-vector (a row of Vᵀ)
  return { sigma, U, Vt };
}

// Rank-k reconstruction A_k = Σ_{i<k} σ_i u_i v_iᵀ
function reconstruct(U: Float64Array[], sigma: number[], Vt: Float64Array[], k: number): number[][] {
  const R: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let t = 0; t < k; t++) {
    const u = U[t], v = Vt[t], s = sigma[t];
    for (let r = 0; r < N; r++) {
      const su = s * u[r];
      for (let c = 0; c < N; c++) R[r][c] += su * v[c];
    }
  }
  return R;
}

function drawMatrix(ctx: CanvasRenderingContext2D, M: number[][], x: number, y: number, size: number) {
  const cell = size / N;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      let v = M[r][c];
      v = v < 0 ? 0 : v > 1 ? 1 : v;
      const g = Math.round(v * 255);
      ctx.fillStyle = `rgb(${g},${g},${g})`;
      ctx.fillRect(x + c * cell, y + r * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }
  ctx.strokeStyle = PALETTE.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 0.5, y - 0.5, size + 1, size + 1);
}

const PRESETS: Record<string, number> = {
  "Rank 1 (blurry)": 1,
  "Rank 4": 4,
  "Rank 12": 12,
  "Full (64)": 64,
};

export function SVDStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { A, sigma, U, Vt, totalEnergy } = useMemo(() => {
    const img = buildImage();
    const { sigma, U, Vt } = svd(img);
    const totalEnergy = sigma.reduce((s, v) => s + v * v, 0) || 1;
    return { A: img, sigma, U, Vt, totalEnergy };
  }, []);

  const [{ k }, update] = useShareableNumbers({ k: 6 });
  const kk = Math.max(1, Math.min(N, Math.round(k)));

  const recon = useMemo(() => reconstruct(U, sigma, Vt, kk), [U, sigma, Vt, kk]);

  const energy = useMemo(() => {
    let e = 0;
    for (let i = 0; i < kk; i++) e += sigma[i] * sigma[i];
    return e / totalEnergy;
  }, [sigma, kk, totalEnergy]);

  const ratio = (N * N) / (kk * (N + N + 1));

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, W, H);

    const S = 190, iY = 44;
    const oX = 70, rX = W - 70 - S;

    ctx.textAlign = "left";
    ctx.font = "600 13px ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = PALETTE.text;
    ctx.fillText("Original  (64×64)", oX, iY - 12);
    ctx.fillStyle = PALETTE.primary;
    ctx.fillText(`Rank ${kk} reconstruction`, rX, iY - 12);

    drawMatrix(ctx, A, oX, iY, S);
    drawMatrix(ctx, recon, rX, iY, S);

    // singular-value spectrum (log scale)
    const spX = 70, spY = iY + S + 46, spW = W - 140, spH = H - spY - 30;
    ctx.fillStyle = PALETTE.text;
    ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("Singular value spectrum  σ₁ … σ₆₄  (log scale)", spX, spY - 10);

    const logs = sigma.map((s) => Math.log10(s + 1e-6));
    const lmax = logs[0];
    let lmin = logs[0];
    for (const l of logs) if (l < lmin) lmin = l;
    const barW = spW / N;
    for (let i = 0; i < N; i++) {
      const frac = (logs[i] - lmin) / ((lmax - lmin) || 1);
      const bh = Math.max(1, frac * spH);
      ctx.fillStyle = i < kk ? PALETTE.primary : PALETTE.axis;
      ctx.fillRect(spX + i * barW, spY + spH - bh, Math.max(1, barW - 1), bh);
    }
    // dashed marker at the rank cutoff
    const kx = spX + kk * barW;
    ctx.strokeStyle = PALETTE.accent;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(kx, spY);
    ctx.lineTo(kx, spY + spH);
    ctx.stroke();
    ctx.setLineDash([]);
    // baseline
    ctx.strokeStyle = PALETTE.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(spX, spY + spH);
    ctx.lineTo(spX + spW, spY + spH);
    ctx.stroke();
  }, [A, recon, sigma, kk]);

  const pct = (energy * 100).toFixed(1);
  const explain =
    kk <= 2
      ? `At rank ${kk}, only the ${kk} strongest mode${kk > 1 ? "s" : ""} survive — enough to capture the smooth gradient (${pct}% of the image's energy), but the sharp edges of the shape are still blurred away.`
      : energy >= 0.99
      ? `Rank ${kk} already reconstructs ${pct}% of the energy: the result is visually indistinguishable from the original, yet stores about ${ratio.toFixed(1)}× fewer numbers.`
      : `Rank ${kk} keeps ${pct}% of the energy at a ${ratio.toFixed(1)}× compression ratio. The largest singular values rebuild the low-frequency structure first; adding more modes sharpens the edges.`;

  const code = `import numpy as np

# Rebuild the same 64x64 test image, then its rank-k approximation.
N, k = ${N}, ${kk}
cols = np.arange(N)
A = np.zeros((N, N))
for r in range(N):
    A[r] = 0.18 + 0.42 * (cols / (N - 1)) + 0.12 * np.sin((r / (N - 1)) * np.pi)
# draw a bright "P"
A[12:52, 16:22] = 0.95
A[12:18, 16:40] = 0.95
A[30:36, 16:40] = 0.95
A[12:36, 34:40] = 0.95

U, S, Vt = np.linalg.svd(A, full_matrices=False)   # A = U @ diag(S) @ Vt
A_k = (U[:, :k] * S[:k]) @ Vt[:k]                   # rank-k reconstruction

energy = (S[:k] ** 2).sum() / (S ** 2).sum()
ratio = (N * N) / (k * (2 * N + 1))
print(f"rank {k}: energy captured = {energy:.4f}, compression = {ratio:.1f}x")`;

  return (
    <StudioChrome title="SVD Studio" tagline="low-rank image compression"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">A real one-sided Jacobi SVD factors a 64×64 image into modes A = UΣVᵀ. Keep the top k singular values to compress it — watch the shape emerge as k grows.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update({ k: PRESETS[label] })}
        />
        <Slider label="Rank k" value={kk} min={1} max={N} step={1} onChange={(v) => update({ k: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Rank k" value={`${kk} / ${N}`} />
        <Stat label="Energy captured" value={`${pct}%`} />
        <Stat label="Compression" value={`${ratio.toFixed(1)}×`} />
        <Stat label="Stored numbers" value={`${kk * (N + N + 1)}`} />
        <Equation tex={`A = U\\,\\Sigma\\,V^{\\top}\\qquad A_k=\\sum_{i=1}^{${kk}}\\sigma_i\\,u_i v_i^{\\top}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
