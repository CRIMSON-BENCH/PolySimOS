"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { sx: number; sy: number; txy: number }> = {
  "Uniaxial tension": { sx: 100, sy: 0, txy: 0 },
  "Pure shear": { sx: 0, sy: 0, txy: 60 },
  "Equal biaxial": { sx: 80, sy: 80, txy: 0 },
  "Shear + tension": { sx: 120, sy: 20, txy: 50 },
};

export function MohrsCircleStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ sx, sy, txy }, update] = useShareableNumbers({ sx: 80, sy: 20, txy: 30 });

  const center = (sx + sy) / 2; const R = Math.sqrt(((sx - sy) / 2) ** 2 + txy ** 2);
  const s1 = center + R, s2 = center - R; const tmax = R;
  const theta = 0.5 * Math.atan2(2 * txy, sx - sy) * 180 / Math.PI;

  useEffect(() => {
    const W = 500, H = 360; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = 250, cy = 180; const scale = 120 / Math.max(R, Math.abs(center), 40);
    // axes
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(30, cy); ctx.lineTo(W - 20, cy); ctx.moveTo(cx, 20); ctx.lineTo(cx, H - 20); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("σ", W - 30, cy - 6); ctx.fillText("τ", cx + 6, 30);
    // circle
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx + center * scale, cy, R * scale, 0, 7); ctx.stroke();
    // principal points
    ctx.fillStyle = "#a3e635"; [s1, s2].forEach((sp) => { ctx.beginPath(); ctx.arc(cx + sp * scale, cy, 4, 0, 7); ctx.fill(); });
    // current stress point (sx, txy) and (sy, -txy)
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(cx + sx * scale, cy - txy * scale, 5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(cx + sy * scale, cy + txy * scale, 5, 0, 7); ctx.fill();
    ctx.strokeStyle = "#f472b6"; ctx.beginPath(); ctx.moveTo(cx + sx * scale, cy - txy * scale); ctx.lineTo(cx + sy * scale, cy + txy * scale); ctx.stroke();
    ctx.fillStyle = "#e2e8f0"; ctx.fillText("σ₁", cx + s1 * scale - 6, cy + 16); ctx.fillText("σ₂", cx + s2 * scale - 6, cy + 16);
  }, [sx, sy, txy, R, center, s1, s2]);

  const explain =
    Math.abs(sx - sy) < 1 && Math.abs(txy) < 1
      ? "Both principal stresses are equal, so Mohr's circle shrinks to a point — every plane feels the same normal stress and there is no shear anywhere."
      : Math.abs(txy) < 1
      ? "With no applied shear your x-y axes are already principal: σ₁ and σ₂ land right on σx and σy, and τmax is just half their difference."
      : `The circle radius sets τmax = ${tmax.toFixed(1)} MPa on planes 45° from the principals; rotate the element by ${theta.toFixed(1)}° to reach the shear-free principal orientation.`;

  const code = `import numpy as np
sx, sy, txy = ${sx}, ${sy}, ${txy}
c = (sx + sy) / 2
R = np.hypot((sx - sy) / 2, txy)
s1, s2 = c + R, c - R
theta = 0.5 * np.degrees(np.arctan2(2 * txy, sx - sy))
print("s1", s1, "s2", s2, "tmax", R, "angle", theta)`;

  return (
    <StudioChrome title="Mohr's Circle" tagline="2D stress transformation"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="σx (MPa)" value={sx} min={-100} max={150} step={5} onChange={(v) => update({ sx: v })} />
        <Slider label="σy (MPa)" value={sy} min={-100} max={150} step={5} onChange={(v) => update({ sy: v })} />
        <Slider label="τxy (MPa)" value={txy} min={-80} max={80} step={5} onChange={(v) => update({ txy: v })} />
        <p className="mt-3 text-xs text-slate-500">Mohr&apos;s circle is a graphical way to transform a 2D stress state to any rotated axis. The circle&apos;s center is the average normal stress and its radius is the maximum shear. Where it crosses the horizontal axis gives the principal stresses — the orientation with zero shear. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="σ₁ (max principal)" value={`${s1.toFixed(1)} MPa`} /><Stat label="σ₂ (min principal)" value={`${s2.toFixed(1)} MPa`} /><Stat label="τmax" value={`${tmax.toFixed(1)} MPa`} /><Stat label="Principal angle" value={`${theta.toFixed(1)}°`} /><Equation tex={`\\sigma_{1,2}=\\frac{${sx}+${sy}}{2}\\pm\\sqrt{\\left(\\frac{${sx}-${sy}}{2}\\right)^2+${txy}^2}=${s1.toFixed(1)},\\,${s2.toFixed(1)}\\ \\text{MPa}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
