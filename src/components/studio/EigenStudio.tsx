"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 520, H = 480;

export function EigenStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [a, setA] = useState(2), [b, setB] = useState(1), [c, setC] = useState(1), [d, setD] = useState(2);

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

  return (
    <StudioChrome title="Eigenvector Visualizer" tagline="2×2 linear transformation"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">A matrix warps the unit circle into an ellipse. Eigenvectors are the special directions that only stretch — never rotate — by their eigenvalue.</p>
        <div className="grid grid-cols-2 gap-2">
          <Slider label="a" value={a} min={-3} max={3} step={0.1} onChange={setA} />
          <Slider label="b" value={b} min={-3} max={3} step={0.1} onChange={setB} />
          <Slider label="c" value={c} min={-3} max={3} step={0.1} onChange={setC} />
          <Slider label="d" value={d} min={-3} max={3} step={0.1} onChange={setD} />
        </div>
      </div>}
      inspector={<div><Stat label="det" value={(a * d - b * c).toFixed(2)} /><Stat label="trace" value={(a + d).toFixed(2)} /><Stat label="λ₁" value={eig.real ? eig.l1.toFixed(2) : "complex"} /><Stat label="λ₂" value={eig.real ? eig.l2.toFixed(2) : "complex"} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[460px] rounded-lg" /></StudioChrome>
  );
}

function norm(v: number[]): [number, number] { const m = Math.hypot(v[0], v[1]) || 1; return [v[0] / m, v[1] / m]; }
