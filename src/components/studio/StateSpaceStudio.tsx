"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { a11: number; a12: number; a21: number; a22: number }> = {
  "Stable spiral": { a11: -0.3, a12: 1, a21: -1, a22: -0.3 },
  "Saddle": { a11: 1, a12: 0, a21: 0, a22: -1 },
  "Center (orbits)": { a11: 0, a12: 1, a21: -1, a22: 0 },
  "Unstable node": { a11: 0.6, a12: 0, a21: 0, a22: 0.9 },
};

export function StateSpaceStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ a11, a12, a21, a22 }, update] = useShareableNumbers({ a11: 0, a12: 1, a21: -1, a22: -0.3 });
  // eigenvalues of [[a11,a12],[a21,a22]]
  const tr = a11 + a22, det = a11 * a22 - a12 * a21, disc = tr * tr / 4 - det;
  const reLam = tr / 2, imLam = disc < 0 ? Math.sqrt(-disc) : 0;
  const kind = det < 0 ? "saddle" : reLam > 0.01 ? (imLam ? "unstable spiral" : "unstable node") : reLam < -0.01 ? (imLam ? "stable spiral" : "stable node") : "center";

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, sc = 26;
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(20, cy); ctx.lineTo(W - 10, cy); ctx.moveTo(cx, 20); ctx.lineTo(cx, H - 20); ctx.stroke();
    // trajectories from several starts
    const starts = [[3, 0], [-3, 0], [0, 3], [0, -3], [2, 2], [-2, -2], [2, -2], [-2, 2]];
    starts.forEach(([sx, sy], k) => { let x = sx, y = sy; const dt = 0.02; ctx.strokeStyle = `hsl(${190 + k * 12},70%,55%)`; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.moveTo(cx + x * sc, cy - y * sc); for (let i = 0; i < 500; i++) { const dx = a11 * x + a12 * y, dy = a21 * x + a22 * y; x += dx * dt; y += dy * dt; if (Math.abs(x) > 12 || Math.abs(y) > 12) break; ctx.lineTo(cx + x * sc, cy - y * sc); } ctx.stroke(); });
    ctx.globalAlpha = 1; ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`phase portrait — ${kind}`, 12, 22);
  }, [a11, a12, a21, a22, kind]);

  const explain =
    kind === "saddle"
      ? "The determinant is negative, so eigenvalues have opposite signs: one direction pulls in, the other flings out — an unstable saddle with no equilibrium the system settles into."
      : kind === "center"
      ? "Eigenvalues are purely imaginary, so trajectories neither grow nor decay — they trace closed orbits around the origin (a marginally-stable center)."
      : kind === "stable spiral"
      ? "Complex eigenvalues with negative real part: trajectories spiral inward, oscillating while decaying to the origin — a stable, ringing system."
      : kind === "stable node"
      ? "Both eigenvalues are real and negative, so every trajectory decays monotonically into the origin — a stable node with no oscillation."
      : kind === "unstable spiral"
      ? "Complex eigenvalues with positive real part: trajectories spiral outward, oscillating with growing amplitude — the origin repels."
      : "Both eigenvalues are real and positive, so trajectories accelerate away from the origin along straight-ish paths — an unstable node.";

  const code = `import numpy as np
A = np.array([[${a11}, ${a12}], [${a21}, ${a22}]])
eig = np.linalg.eigvals(A)
print("trace", A.trace(), "det", np.linalg.det(A))
print("eigenvalues", eig)`;

  return (
    <StudioChrome title="State-Space Phase Portrait" tagline="the shape of a linear system"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="a₁₁" value={a11} min={-2} max={2} step={0.1} onChange={(v) => update({ a11: v })} />
        <Slider label="a₁₂" value={a12} min={-2} max={2} step={0.1} onChange={(v) => update({ a12: v })} />
        <Slider label="a₂₁" value={a21} min={-2} max={2} step={0.1} onChange={(v) => update({ a21: v })} />
        <Slider label="a₂₂" value={a22} min={-2} max={2} step={0.1} onChange={(v) => update({ a22: v })} />
        <p className="mt-3 text-xs text-slate-500">A linear state-space system ẋ = Ax has a character set by the eigenvalues of A. Negative real parts spiral or decay to the origin (stable); positive parts fly outward; imaginary parts add rotation. The phase portrait reveals it all at a glance. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Trace / Det" value={`${tr.toFixed(2)} / ${det.toFixed(2)}`} />
        <Stat label="Eigenvalues" value={imLam ? `${reLam.toFixed(2)} ± ${imLam.toFixed(2)}j` : `${(reLam + Math.sqrt(Math.max(0, disc))).toFixed(2)}, ${(reLam - Math.sqrt(Math.max(0, disc))).toFixed(2)}`} />
        <Stat label="Classification" value={kind} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
