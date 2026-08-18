"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Restricted 3-body: effective potential in rotating frame + L1-L5.
export function LagrangeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mu, setMu] = useState(0.15); // mass ratio m2/(m1+m2)
  const [showPot, setShowPot] = useState(true);

  useEffect(() => {
    const W = 480, H = 420; const ctx = hidpi(canvasRef.current!, W, H); const cx = W / 2, cy = H / 2; const scale = 130;
    // positions (rotating frame), primary at -mu, secondary at 1-mu
    const x1 = -mu, x2 = 1 - mu;
    const Omega = (X: number, Y: number) => { const r1 = Math.hypot(X - x1, Y), r2 = Math.hypot(X - x2, Y); return 0.5 * (X * X + Y * Y) + (1 - mu) / (r1 + 1e-6) + mu / (r2 + 1e-6); };
    if (showPot) { const img = ctx.createImageData(W, H);
      for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) { const X = (px - cx) / scale, Y = (py - cy) / scale; let v = Omega(X, Y); v = Math.min(3.5, v); const t = (v - 1.4) / 2.1;
        const idx = (py * W + px) * 4; const band = (Math.sin(v * 24) * 0.5 + 0.5) * 30; img.data[idx] = 11 + t * 40 + band; img.data[idx + 1] = 18 + t * 60; img.data[idx + 2] = 32 + (1 - t) * 90 + band; img.data[idx + 3] = 255; }
      ctx.putImageData(img, 0, 0);
    } else { ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H); }
    // L points (approx). Collinear via series; triangular exact.
    const L1 = x2 - Math.pow(mu / 3, 1 / 3), L2 = x2 + Math.pow(mu / 3, 1 / 3), L3 = -1 - (5 / 12) * mu;
    const pts: [number, number, string][] = [[L1, 0, "L1"], [L2, 0, "L2"], [L3, 0, "L3"], [0.5 - mu, Math.sqrt(3) / 2, "L4"], [0.5 - mu, -Math.sqrt(3) / 2, "L5"]];
    ctx.fillStyle = "#a3e635"; ctx.font = "11px sans-serif";
    pts.forEach(([X, Y, lbl]) => { const px = cx + X * scale, py = cy + Y * scale; ctx.beginPath(); ctx.arc(px, py, 4, 0, 7); ctx.fillStyle = "#a3e635"; ctx.fill(); ctx.fillStyle = "#e2e8f0"; ctx.fillText(lbl, px + 6, py - 4); });
    // bodies
    ctx.beginPath(); ctx.arc(cx + x1 * scale, cy, 10, 0, 7); ctx.fillStyle = "#fbbf24"; ctx.fill();
    ctx.beginPath(); ctx.arc(cx + x2 * scale, cy, 6, 0, 7); ctx.fillStyle = "#60a5fa"; ctx.fill();
  }, [mu, showPot]);

  return (
    <StudioChrome title="Lagrange Points" tagline="restricted three-body problem"
      controls={<div>
        <Slider label="Mass ratio μ" value={mu} min={0.01} max={0.5} step={0.01} onChange={setMu} />
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" checked={showPot} onChange={(e) => setShowPot(e.target.checked)} /> Show effective potential</label>
        <p className="mt-3 text-xs text-slate-500">In a two-body system, five points let a small object stay fixed in the rotating frame. L1-L3 sit on the line through the two masses (unstable); L4 and L5 lead and trail the secondary by 60° and are stable for μ below 0.0385 — where Jupiter&apos;s Trojan asteroids live. JWST orbits the Sun-Earth L2.</p>
      </div>}
      inspector={<div><Stat label="μ = m₂/(m₁+m₂)" value={mu.toFixed(3)} /><Stat label="L4/L5 stable?" value={mu < 0.0385 ? "yes" : "no"} /><Stat label="Points" value="5" /></div>}
    ><canvas ref={canvasRef} width={480} height={420} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
