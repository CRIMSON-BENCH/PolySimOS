"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function StateSpaceStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [a11, setA11] = useState(0), [a12, setA12] = useState(1), [a21, setA21] = useState(-1), [a22, setA22] = useState(-0.3);
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

  return (
    <StudioChrome title="State-Space Phase Portrait" tagline="the shape of a linear system"
      controls={<div>
        <Slider label="a₁₁" value={a11} min={-2} max={2} step={0.1} onChange={setA11} />
        <Slider label="a₁₂" value={a12} min={-2} max={2} step={0.1} onChange={setA12} />
        <Slider label="a₂₁" value={a21} min={-2} max={2} step={0.1} onChange={setA21} />
        <Slider label="a₂₂" value={a22} min={-2} max={2} step={0.1} onChange={setA22} />
        <p className="mt-3 text-xs text-slate-500">A linear state-space system ẋ = Ax has a character set by the eigenvalues of A. Negative real parts spiral or decay to the origin (stable); positive parts fly outward; imaginary parts add rotation. The phase portrait reveals it all at a glance. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Trace / Det" value={`${tr.toFixed(2)} / ${det.toFixed(2)}`} />
        <Stat label="Eigenvalues" value={imLam ? `${reLam.toFixed(2)} ± ${imLam.toFixed(2)}j` : `${(reLam + Math.sqrt(Math.max(0, disc))).toFixed(2)}, ${(reLam - Math.sqrt(Math.max(0, disc))).toFixed(2)}`} />
        <Stat label="Classification" value={kind} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
