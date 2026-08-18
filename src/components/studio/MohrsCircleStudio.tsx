"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function MohrsCircleStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sx, setSx] = useState(80);
  const [sy, setSy] = useState(20);
  const [txy, setTxy] = useState(30);

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

  return (
    <StudioChrome title="Mohr's Circle" tagline="2D stress transformation"
      controls={<div>
        <Slider label="σx (MPa)" value={sx} min={-100} max={150} step={5} onChange={setSx} />
        <Slider label="σy (MPa)" value={sy} min={-100} max={150} step={5} onChange={setSy} />
        <Slider label="τxy (MPa)" value={txy} min={-80} max={80} step={5} onChange={setTxy} />
        <p className="mt-3 text-xs text-slate-500">Mohr&apos;s circle is a graphical way to transform a 2D stress state to any rotated axis. The circle&apos;s center is the average normal stress and its radius is the maximum shear. Where it crosses the horizontal axis gives the principal stresses — the orientation with zero shear. Educational tool.</p>
      </div>}
      inspector={<div><Stat label="σ₁ (max principal)" value={`${s1.toFixed(1)} MPa`} /><Stat label="σ₂ (min principal)" value={`${s2.toFixed(1)} MPa`} /><Stat label="τmax" value={`${tmax.toFixed(1)} MPa`} /><Stat label="Principal angle" value={`${theta.toFixed(1)}°`} /></div>}
    ><canvas ref={canvasRef} width={500} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
