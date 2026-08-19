"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, PALETTE } from "@/lib/studioKit";

const W = 760, H = 480, N = 4;

type Mat = number[][];

// Compact numeric formatter for on-canvas cells (kills -0, keeps ≤2 decimals).
const fmt = (v: number) => {
  if (!isFinite(v)) return "∞";
  if (Math.abs(v) < 1e-9) return "0";
  const r = Math.round(v * 100) / 100;
  return Number.isInteger(r) ? String(r) : String(r);
};

const clone = (m: Mat): Mat => m.map((r) => r.slice());
const ident = (n: number): Mat => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));

const PRESETS: Record<string, Mat> = {
  "Well-conditioned": [
    [4, 1, 0, 1],
    [1, 5, 1, 0],
    [0, 1, 6, 2],
    [1, 0, 2, 7],
  ],
  "Needs pivoting": [
    [0, 2, 1, 1],
    [1, 1, 0, 2],
    [2, 1, 3, 1],
    [1, 0, 1, 3],
  ],
  Singular: [
    [1, 2, 3, 4],
    [2, 4, 6, 8], // = 2 × row 1  → linearly dependent
    [1, 0, 1, 0],
    [0, 1, 0, 1],
  ],
  Identity: ident(N),
};

const randMat = (): Mat =>
  Array.from({ length: N }, () => Array.from({ length: N }, () => Math.floor(Math.random() * 15) - 5));

type Frame = {
  mat: Mat;
  label: string;
  pivot: [number, number] | null;
  targetRow?: number;
  swap?: [number, number];
  singular?: boolean;
};

// REAL Gaussian elimination with partial pivoting: produces P, L, U with PA = LU,
// recording a frame after every row operation so the slider can step through it.
function computeLU(A: Mat) {
  const n = A.length;
  const U = clone(A);
  const L = ident(n);
  const perm = Array.from({ length: n }, (_, i) => i);
  let swaps = 0, pivots = 0, singular = false;
  const frames: Frame[] = [];
  const snap = (extra: Omit<Frame, "mat">) => frames.push({ mat: clone(U), ...extra });

  snap({ label: "Initial matrix A", pivot: null });

  for (let k = 0; k < n; k++) {
    // Partial pivoting: choose the row with the largest |value| in column k.
    let maxRow = k, maxVal = Math.abs(U[k][k]);
    for (let i = k + 1; i < n; i++) {
      const a = Math.abs(U[i][k]);
      if (a > maxVal) { maxVal = a; maxRow = i; }
    }
    if (maxVal < 1e-12) {
      singular = true;
      snap({ label: `Column ${k + 1}: no nonzero pivot — the matrix is singular`, pivot: [k, k], singular: true });
      continue;
    }
    if (maxRow !== k) {
      [U[k], U[maxRow]] = [U[maxRow], U[k]];
      [perm[k], perm[maxRow]] = [perm[maxRow], perm[k]];
      for (let j = 0; j < k; j++) { const t = L[k][j]; L[k][j] = L[maxRow][j]; L[maxRow][j] = t; }
      swaps++;
      snap({ label: `Swap R${k + 1} ↔ R${maxRow + 1} — largest |pivot| in column ${k + 1}`, pivot: [k, k], swap: [k, maxRow] });
    }
    pivots++;
    for (let i = k + 1; i < n; i++) {
      const m = U[i][k] / U[k][k];
      L[i][k] = m;
      for (let j = k; j < n; j++) U[i][j] -= m * U[k][j];
      U[i][k] = 0; // enforce an exact structural zero below the pivot
      snap({ label: `R${i + 1} ← R${i + 1} − (${fmt(m)})·R${k + 1}`, pivot: [k, k], targetRow: i });
    }
  }

  let det = swaps % 2 === 0 ? 1 : -1;
  for (let i = 0; i < n; i++) det *= U[i][i];
  if (singular) det = 0;

  const P = ident(n).map((_, i) => ident(n)[perm[i]]);
  return { frames, L, U, P, perm, swaps, pivots, singular, det };
}

export function MatrixEliminationStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [presetName, setPresetName] = useState("Well-conditioned");
  const [matrix, setMatrix] = useState<Mat>(PRESETS["Well-conditioned"]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);

  const { frames, L, U, P, swaps, pivots, singular, det } = useMemo(() => computeLU(matrix), [matrix]);
  const numSteps = frames.length - 1;
  const frame = frames[Math.min(step, numSteps)];
  const complete = step >= numSteps;

  const applyPreset = (label: string) => {
    setPresetName(label);
    setMatrix(label === "Random" ? randMat() : clone(PRESETS[label]));
  };

  // Reset + autoplay whenever the matrix changes.
  useEffect(() => { setStep(0); setPlaying(true); }, [matrix]);
  useEffect(() => {
    if (!playing) return;
    if (step >= numSteps) { setPlaying(false); return; }
    const id = setTimeout(() => setStep((s) => Math.min(s + 1, numSteps)), 750);
    return () => clearTimeout(id);
  }, [playing, step, numSteps]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, W, H);

    const drawMatrix = (
      mat: Mat, ox: number, oy: number, cw: number, ch: number,
      opts: { pivot?: [number, number] | null; targetRow?: number; title?: string; small?: boolean } = {},
    ) => {
      const n = mat.length;
      if (opts.title) {
        ctx.fillStyle = PALETTE.text;
        ctx.font = `600 ${opts.small ? 12 : 13}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
        ctx.fillText(opts.title, ox, oy - 10);
      }
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const cx = ox + j * cw, cy = oy + i * ch;
        const isPivot = !!opts.pivot && opts.pivot[0] === i && opts.pivot[1] === j;
        if (isPivot) {
          ctx.fillStyle = "rgba(34,211,238,0.28)"; ctx.fillRect(cx, cy, cw, ch);
          ctx.strokeStyle = PALETTE.primary; ctx.lineWidth = 2; ctx.strokeRect(cx + 1.5, cy + 1.5, cw - 3, ch - 3);
        } else if (opts.targetRow === i) {
          ctx.fillStyle = "rgba(245,158,11,0.13)"; ctx.fillRect(cx, cy, cw, ch);
        }
        const v = mat[i][j];
        ctx.fillStyle = isPivot ? "#e0faff" : Math.abs(v) < 1e-9 ? "#475569" : "#e2e8f0";
        ctx.font = `${opts.small ? 12 : 15}px ui-monospace, SFMono-Regular, monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(fmt(v), cx + cw / 2, cy + ch / 2);
      }
      // matrix brackets
      ctx.strokeStyle = PALETTE.axis; ctx.lineWidth = 2;
      const x2 = ox + n * cw, y2 = oy + n * ch, b = 7;
      ctx.beginPath(); ctx.moveTo(ox + b, oy); ctx.lineTo(ox, oy); ctx.lineTo(ox, y2); ctx.lineTo(ox + b, y2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2 - b, oy); ctx.lineTo(x2, oy); ctx.lineTo(x2, y2); ctx.lineTo(x2 - b, y2); ctx.stroke();
    };

    // Operation label / step banner.
    ctx.fillStyle = frame.singular ? "#f87171" : frame.pivot ? "#fbbf24" : PALETTE.text;
    ctx.font = "600 15px ui-monospace, monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText(frame.label, 44, 40);
    ctx.fillStyle = PALETTE.text;
    ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(`Step ${Math.min(step, numSteps)} / ${numSteps}`, 44, 60);

    // Working elimination matrix (left).
    drawMatrix(frame.mat, 44, 108, 58, 46, {
      pivot: frame.pivot, targetRow: frame.targetRow,
      title: complete ? "U — upper triangular (elimination complete)" : "Working matrix (elimination in progress)",
    });

    // Resulting L and U (right).
    drawMatrix(L, 430, 108, 32, 28, { small: true, title: "L (unit lower)" });
    drawMatrix(U, 600, 108, 32, 28, { small: true, title: "U (upper)" });
    // Permutation P below.
    drawMatrix(P, 430, 300, 32, 28, { small: true, title: "P (row swaps)" });

    // det summary (bottom-left, near working matrix).
    ctx.fillStyle = singular ? "#f87171" : PALETTE.accent;
    ctx.font = "600 14px ui-monospace, monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText(`det(A) = ${singular ? "0  (singular)" : fmt(det)}`, 44, 350);
    ctx.fillStyle = PALETTE.text;
    ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(`pivots: ${pivots}    row swaps: ${swaps}`, 44, 372);
    ctx.fillText("PA = LU  (partial pivoting keeps elimination numerically stable)", 44, 396);
  }, [frame, L, U, P, det, pivots, swaps, singular, complete, step, numSteps]);

  const explain = singular
    ? "Elimination hit a zero pivot with no nonzero entry beneath it — the columns are linearly dependent, so A is singular, det(A) = 0, and no unique LU (or inverse) exists. Partial pivoting could not rescue it because the whole sub-column is zero."
    : swaps > 0
    ? `Partial pivoting swapped ${swaps} row${swaps > 1 ? "s" : ""} to put the largest available entry on each pivot. That avoids dividing by a tiny number, which would blow up rounding error, so PA = LU with det(A) = ${fmt(det)}. The row swaps are recorded in the permutation P.`
    : `Every pivot was already the largest in its column, so no swaps were needed (P = I). The multipliers fill in L, the reduced rows form U, and det(A) = product of U's diagonal = ${fmt(det)}.`;

  const code = `import numpy as np
from scipy.linalg import lu

A = np.array([
${matrix.map((r) => "    [" + r.join(", ") + "]").join(",\n")}
], dtype=float)

# SciPy: A = P @ L @ U  (its P is the inverse permutation of the PA = LU form)
P, L, U = lu(A)
print("P =\\n", P)
print("L =\\n", L)
print("U =\\n", U)
print("det(A) =", np.prod(np.diag(U)) * np.linalg.det(P))

# Reconstruct to verify
print("max reconstruction error:", np.max(np.abs(A - P @ L @ U)))`;

  return (
    <StudioChrome title="Gaussian Elimination Studio" tagline="LU decomposition with partial pivoting"
      controls={<div>
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          {["Well-conditioned", "Needs pivoting", "Singular", "Identity", "Random"].map((s) => (
            <button key={s} onClick={() => applyPreset(s)} className={`rounded-lg px-2 py-1 text-xs font-semibold ${presetName === s ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{s}</button>
          ))}
        </div>
        <p className="mb-3 text-xs text-slate-500">Step through real Gaussian elimination. Partial pivoting swaps rows to keep the pivot large (cyan) and stable; the multipliers build L while the reduced rows build U.</p>
        <Presets
          presets={[
            { label: "Play", hint: "Restart the animation from step 0" },
            { label: "Final", hint: "Jump to the finished U" },
          ]}
          onApply={(label) => { if (label === "Play") { setStep(0); setPlaying(true); } else { setPlaying(false); setStep(numSteps); } }}
        />
        <Slider label="Step" value={Math.min(step, numSteps)} min={0} max={numSteps} step={1} onChange={(v) => { setPlaying(false); setStep(v); }} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Matrix" value={presetName} />
        <Stat label="Pivots" value={String(pivots)} />
        <Stat label="Row swaps" value={String(swaps)} />
        <Stat label="det(A)" value={singular ? "0 (singular)" : fmt(det)} />
        <Stat label="Invertible" value={singular ? "no" : "yes"} />
        <Stat label="Step" value={`${Math.min(step, numSteps)} / ${numSteps}`} />
        <Equation tex={`PA = LU,\\quad \\det(A)=\\operatorname{sign}(P)\\prod_i U_{ii}=${singular ? "0" : fmt(det)}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
