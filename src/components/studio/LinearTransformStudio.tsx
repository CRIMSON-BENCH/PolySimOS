"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers, PALETTE } from "@/lib/studioKit";

const W = 760, H = 480;
const S = 52; // pixels per unit
const R = 7;  // grid extent in units

const PRESETS: Record<string, { a: number; b: number; c: number; d: number }> = {
  Identity: { a: 1, b: 0, c: 0, d: 1 },
  Rotation: { a: 0.7, b: -0.7, c: 0.7, d: 0.7 },
  Scaling: { a: 1.6, b: 0, c: 0, d: 1.6 },
  Shear: { a: 1, b: 1, c: 0, d: 1 },
  Reflection: { a: 1, b: 0, c: 0, d: -1 },
  "Projection (singular)": { a: 1, b: 0, c: 0, d: 0 },
};

// Real eigen-decomposition of a 2x2 matrix, or null components when eigenvalues are complex.
function eigen(a: number, b: number, c: number, d: number) {
  const tr = a + d, det = a * d - b * c;
  const disc = tr * tr - 4 * det;
  if (disc < 0) return { real: false as const, tr, det, disc };
  const s = Math.sqrt(disc);
  const l1 = (tr + s) / 2, l2 = (tr - s) / 2;
  // Eigenvector for eigenvalue l: (A - lI) v = 0.
  const vec = (l: number): [number, number] => {
    // Rows: [a-l, b] and [c, d-l]. Use whichever row is non-degenerate.
    if (Math.abs(b) > 1e-9 || Math.abs(a - l) > 1e-9) {
      const v: [number, number] = [b, l - a];
      const n = Math.hypot(v[0], v[1]);
      if (n > 1e-9) return [v[0] / n, v[1] / n];
    }
    if (Math.abs(c) > 1e-9 || Math.abs(d - l) > 1e-9) {
      const v: [number, number] = [l - d, c];
      const n = Math.hypot(v[0], v[1]);
      if (n > 1e-9) return [v[0] / n, v[1] / n];
    }
    return [1, 0]; // scalar multiple of identity: every direction is an eigenvector
  };
  return { real: true as const, tr, det, disc, l1, l2, v1: vec(l1), v2: vec(l2) };
}

export function LinearTransformStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ a, b, c, d }, update] = useShareableNumbers({ a: 1, b: 0, c: 0, d: 1 });
  const [p, setP] = useState(1); // morph progress from identity (0) to the current matrix (1)

  const ev = useMemo(() => eigen(a, b, c, d), [a, b, c, d]);
  const det = a * d - b * c;
  const trace = a + d;

  // Animate the grid morphing from identity into the current transform whenever it changes.
  useEffect(() => {
    setP(0);
    const id = setInterval(() => setP((v) => (v < 1 ? Math.min(1, v + 0.05) : v)), 20);
    return () => clearInterval(id);
  }, [a, b, c, d]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, W, H);

    // Interpolated matrix (identity -> target).
    const ia = 1 + (a - 1) * p, ib = b * p, ic = c * p, id = 1 + (d - 1) * p;

    // math (x,y) -> canvas pixel, applying matrix m.
    const map = (x: number, y: number, m: [number, number, number, number]): [number, number] => {
      const tx = m[0] * x + m[1] * y, ty = m[2] * x + m[3] * y;
      return [W / 2 + tx * S, H / 2 - ty * S];
    };
    const I: [number, number, number, number] = [1, 0, 0, 1];
    const M: [number, number, number, number] = [ia, ib, ic, id];

    // 1. Faint reference (identity) grid.
    ctx.strokeStyle = PALETTE.grid; ctx.lineWidth = 1;
    for (let k = -R; k <= R; k++) {
      ctx.beginPath();
      let [x0, y0] = map(k, -R, I), [x1, y1] = map(k, R, I);
      ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
      [x0, y0] = map(-R, k, I); [x1, y1] = map(R, k, I);
      ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    // Axes.
    ctx.strokeStyle = PALETTE.axis; ctx.lineWidth = 1.5;
    ctx.beginPath();
    let [ax0, ay0] = map(-R, 0, I), [ax1, ay1] = map(R, 0, I);
    ctx.moveTo(ax0, ay0); ctx.lineTo(ax1, ay1);
    [ax0, ay0] = map(0, -R, I); [ax1, ay1] = map(0, R, I);
    ctx.moveTo(ax0, ay0); ctx.lineTo(ax1, ay1);
    ctx.stroke();

    // 2. Transformed grid.
    ctx.strokeStyle = "rgba(34,211,238,0.28)"; ctx.lineWidth = 1;
    for (let k = -R; k <= R; k++) {
      ctx.beginPath();
      let [x0, y0] = map(k, -R, M), [x1, y1] = map(k, R, M);
      ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
      [x0, y0] = map(-R, k, M); [x1, y1] = map(R, k, M);
      ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    // 3. Shaded transformed unit square (parallelogram): corners (0,0)(1,0)(1,1)(0,1).
    const sq: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
    ctx.beginPath();
    sq.forEach(([x, y], i) => { const [cx, cy] = map(x, y, M); i ? ctx.lineTo(cx, cy) : ctx.moveTo(cx, cy); });
    ctx.closePath();
    ctx.fillStyle = det >= 0 ? "rgba(163,230,53,0.16)" : "rgba(244,114,182,0.18)";
    ctx.fill();
    ctx.strokeStyle = det >= 0 ? "rgba(163,230,53,0.7)" : "rgba(244,114,182,0.8)";
    ctx.lineWidth = 1.5; ctx.stroke();

    // 4. Unit circle mapped to an ellipse.
    ctx.strokeStyle = "rgba(192,132,252,0.85)"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 96; i++) {
      const t = (i / 96) * Math.PI * 2;
      const [cx, cy] = map(Math.cos(t), Math.sin(t), M);
      i ? ctx.lineTo(cx, cy) : ctx.moveTo(cx, cy);
    }
    ctx.stroke();

    // 5. Real eigenvector directions (drawn against the FINAL matrix, unmorphed).
    if (ev.real) {
      const drawEigenLine = (v: [number, number]) => {
        const [ex0, ey0] = map(-R * v[0], -R * v[1], I);
        const [ex1, ey1] = map(R * v[0], R * v[1], I);
        ctx.beginPath(); ctx.moveTo(ex0, ey0); ctx.lineTo(ex1, ey1); ctx.stroke();
      };
      ctx.strokeStyle = "rgba(245,158,11,0.9)"; ctx.lineWidth = 2; ctx.setLineDash([7, 5]);
      drawEigenLine(ev.v1);
      if (Math.abs(ev.l1 - ev.l2) > 1e-6) drawEigenLine(ev.v2);
      ctx.setLineDash([]);
    }

    // 6. Transformed basis vectors i (cyan) and j (green) as arrows.
    const arrow = (tx: number, ty: number, color: string) => {
      const [ox, oy] = map(0, 0, I);
      const [hx, hy] = map(tx, ty, M);
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(hx, hy); ctx.stroke();
      const ang = Math.atan2(hy - oy, hx - ox), s = 10;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx - s * Math.cos(ang - 0.4), hy - s * Math.sin(ang - 0.4));
      ctx.lineTo(hx - s * Math.cos(ang + 0.4), hy - s * Math.sin(ang + 0.4));
      ctx.closePath(); ctx.fill();
    };
    arrow(1, 0, PALETTE.primary); // î
    arrow(0, 1, PALETTE.accent);  // ĵ
  }, [a, b, c, d, p, det, ev]);

  const eigText = ev.real
    ? `λ₁ = ${ev.l1.toFixed(2)}, λ₂ = ${ev.l2.toFixed(2)}`
    : `complex (${(ev.tr / 2).toFixed(2)} ± ${(Math.sqrt(-ev.disc) / 2).toFixed(2)}i)`;

  const explain =
    Math.abs(det) < 1e-6
      ? `The determinant is ${det.toFixed(2)} ≈ 0: the matrix is singular, collapsing the whole plane onto a line (or a point). Area is destroyed and the map can't be inverted — infinitely many inputs share each output.`
      : det < 0
      ? `A determinant of ${det.toFixed(2)} is negative, so the transform flips the plane's orientation (a reflection is baked in). Its magnitude ${Math.abs(det).toFixed(2)} still tells you the area scale factor.`
      : det > 1
      ? `A determinant of ${det.toFixed(2)} means the unit square's area grows by ${det.toFixed(2)}× — the transform expands the plane while preserving orientation.`
      : `A determinant of ${det.toFixed(2)} (between 0 and 1) shrinks areas to ${(det * 100).toFixed(0)}% of the original while preserving orientation.`;

  const code = `import numpy as np

M = np.array([[${a}, ${b}],
              [${c}, ${d}]])

det = np.linalg.det(M)
tr = np.trace(M)
eigvals, eigvecs = np.linalg.eig(M)

print("det   =", round(det, 4))
print("trace =", round(tr, 4))
print("eigenvalues  =", eigvals)
print("eigenvectors =\\n", eigvecs)

# Map the unit square through M
square = np.array([[0, 1, 1, 0], [0, 0, 1, 1]])
print("image of unit square:\\n", M @ square)`;

  return (
    <StudioChrome title="Linear Transformation Studio" tagline="2×2 matrices as geometry"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Set the matrix [[a, b], [c, d]] and watch how it warps the grid, the unit square, and the unit circle. î and ĵ show where the basis vectors land.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="a  (row 1, col 1)" value={a} min={-3} max={3} step={0.1} onChange={(v) => update({ a: v })} />
        <Slider label="b  (row 1, col 2)" value={b} min={-3} max={3} step={0.1} onChange={(v) => update({ b: v })} />
        <Slider label="c  (row 2, col 1)" value={c} min={-3} max={3} step={0.1} onChange={(v) => update({ c: v })} />
        <Slider label="d  (row 2, col 2)" value={d} min={-3} max={3} step={0.1} onChange={(v) => update({ d: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="det (signed area)" value={det.toFixed(3)} />
        <Stat label="trace (a + d)" value={trace.toFixed(3)} />
        <Stat label="eigenvalues" value={ev.real ? "real" : "complex"} />
        <Stat label="λ" value={eigText} />
        <Stat label="orientation" value={Math.abs(det) < 1e-6 ? "collapsed" : det < 0 ? "flipped" : "preserved"} />
        <Equation tex={`M=\\begin{bmatrix}${a}&${b}\\\\${c}&${d}\\end{bmatrix},\\ \\det=ad-bc=${det.toFixed(2)}`} />
        <Equation tex={`\\lambda=\\frac{(a+d)\\pm\\sqrt{(a+d)^2-4(ad-bc)}}{2}`} label="Eigenvalues" />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
