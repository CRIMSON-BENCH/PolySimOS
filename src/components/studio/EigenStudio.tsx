"use client";

import { useEffect, useMemo, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 520, H = 480;

const PRESETS: Record<string, { a: number; b: number; c: number; d: number }> = {
  "Symmetric stretch": { a: 2, b: 1, c: 1, d: 2 },
  "Pure shear": { a: 1, b: 1, c: 0, d: 1 },
  "Reflection": { a: 0, b: 1, c: 1, d: 0 },
  "Rotation (complex λ)": { a: 0, b: -1, c: 1, d: 0 },
};

export function EigenStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ a, b, c, d }, update] = useShareableNumbers({ a: 2, b: 1, c: 1, d: 2 });

  const eig = useMemo(() => {
    const tr = a + d, det = a * d - b * c; const disc = tr * tr - 4 * det;
    if (disc < 0) return { real: false as const, l1: 0, l2: 0, v1: [0, 0], v2: [0, 0] };
    const s = Math.sqrt(disc); const l1 = (tr + s) / 2, l2 = (tr - s) / 2;
    const vec = (l: number): [number, number] => { if (Math.abs(b) > 1e-9) return norm([b, l - a]); if (Math.abs(c) > 1e-9) return norm([l - d, c]); return [1, 0]; };
    return { real: true as const, l1, l2, v1: vec(l1), v2: vec(l2) };
  }, [a, b, c, d]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H); const cx = W / 2, cy = H / 2, S = 60;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    // unit circle
    ctx.strokeStyle = "rgba(148,163,184,0.5)"; ctx.beginPath(); ctx.arc(cx, cy, S, 0, 7); ctx.stroke();
    // transformed ellipse
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let t = 0; t <= 6.3; t += 0.05) { const x = Math.cos(t), y = Math.sin(t); const tx = a * x + b * y, ty = c * x + d * y; const px = cx + tx * S, py = cy - ty * S; t === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.closePath(); ctx.stroke();
    // eigenvectors
    if (eig.real) { [[eig.v1, "#a3e635"], [eig.v2, "#f472b6"]].forEach(([v, col]) => { const [vx, vy] = v as [number, number]; ctx.strokeStyle = col as string; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - vx * S * 2, cy + vy * S * 2); ctx.lineTo(cx + vx * S * 2, cy - vy * S * 2); ctx.stroke(); }); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("unit circle → ellipse; eigenvectors are the invariant directions", 12, 20);
  }, [a, b, c, d, eig]);

  const explain = !eig.real
    ? "Complex eigenvalues: the transform rotates every vector, so no real direction stays fixed — the ellipse has no invariant axis."
    : Math.abs(b - c) < 1e-6
    ? "Symmetric matrix (b = c): its eigenvectors meet at right angles, so the ellipse axes line up exactly with the green and pink lines."
    : Math.abs(eig.l1 - eig.l2) < 1e-6
    ? "Repeated eigenvalue: the two invariant directions collapse toward one — a shear-like map with a single eigenline."
    : `Eigenvalues ${eig.l1.toFixed(2)} and ${eig.l2.toFixed(2)}: along each colored line the matrix only stretches, never rotates.`;

  const code = `import numpy as np
A = np.array([[${a}, ${b}], [${c}, ${d}]])
w, v = np.linalg.eig(A)
print("eigenvalues", w)
print("eigenvectors (columns)", v)`;

  return (
    <StudioChrome title="Eigenvector Visualizer" tagline="2×2 linear transformation"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">A matrix warps the unit circle into an ellipse. Eigenvectors are the special directions that only stretch — never rotate — by their eigenvalue.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <div className="grid grid-cols-2 gap-2">
          <Slider label="a" value={a} min={-3} max={3} step={0.1} onChange={(v) => update({ a: v })} />
          <Slider label="b" value={b} min={-3} max={3} step={0.1} onChange={(v) => update({ b: v })} />
          <Slider label="c" value={c} min={-3} max={3} step={0.1} onChange={(v) => update({ c: v })} />
          <Slider label="d" value={d} min={-3} max={3} step={0.1} onChange={(v) => update({ d: v })} />
        </div>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="det" value={(a * d - b * c).toFixed(2)} /><Stat label="trace" value={(a + d).toFixed(2)} /><Stat label="λ₁" value={eig.real ? eig.l1.toFixed(2) : "complex"} /><Stat label="λ₂" value={eig.real ? eig.l2.toFixed(2) : "complex"} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[460px] rounded-lg" /></StudioChrome>
  );
}

function norm(v: number[]): [number, number] { const m = Math.hypot(v[0], v[1]) || 1; return [v[0] / m, v[1] / m]; }
