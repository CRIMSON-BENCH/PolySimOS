"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const ORBITALS: Record<string, { n: number; label: string; psi: (r: number, ct: number) => number }> = {
  "1s": { n: 1, label: "1s", psi: (r) => Math.exp(-r) },
  "2s": { n: 2, label: "2s", psi: (r) => (2 - r) * Math.exp(-r / 2) },
  "2p": { n: 2, label: "2p_z", psi: (r, ct) => r * ct * Math.exp(-r / 2) },
  "3p": { n: 3, label: "3p_z", psi: (r, ct) => (6 - r) * r * ct * Math.exp(-r / 3) },
  "3d": { n: 3, label: "3d_z²", psi: (r, ct) => (3 * ct * ct - 1) * r * r * Math.exp(-r / 3) },
};

export function HydrogenOrbitalStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [orb, setOrb] = useState("2p");

  useEffect(() => {
    const o = ORBITALS[orb]; const W = 400, H = 400; const ctx = hidpi(canvasRef.current!, W, H);
    const img = ctx.createImageData(W, H); const cx = W / 2, cy = H / 2; const scale = 7 * o.n;
    let maxV = 0; for (let py = 0; py < H; py += 2) for (let px = 0; px < W; px += 2) { const x = (px - cx) / scale, z = (py - cy) / scale; const r = Math.hypot(x, z); const ct = r > 0 ? z / r : 0; const v = o.psi(r, ct) ** 2; if (v > maxV) maxV = v; }
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) { const x = (px - cx) / scale, z = (py - cy) / scale; const r = Math.hypot(x, z); const ct = r > 0 ? z / r : 0; const v = Math.min(1, (o.psi(r, ct) ** 2) / maxV * 3); const idx = (py * W + px) * 4;
      img.data[idx] = 20 + v * 80; img.data[idx + 1] = 20 + v * 200; img.data[idx + 2] = 40 + v * 220; img.data[idx + 3] = 255; }
    ctx.putImageData(img, 0, 0);
    ctx.fillStyle = "#e2e8f0"; ctx.font = "13px sans-serif"; ctx.fillText(`hydrogen ${o.label} — |ψ|² (cross-section)`, 12, H - 14);
  }, [orb]);

  return (
    <StudioChrome title="Hydrogen Orbitals" tagline="electron probability clouds"
      controls={<div>
        <div className="mb-3 grid grid-cols-3 gap-2">{Object.keys(ORBITALS).map((k) => <button key={k} onClick={() => setOrb(k)} className={`rounded-lg px-2 py-1.5 text-xs font-semibold ${orb === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{ORBITALS[k].label}</button>)}</div>
        <p className="mt-3 text-xs text-slate-500">Solving the Schrödinger equation for hydrogen gives the orbitals — the three-dimensional probability clouds where an electron is likely to be found. The quantum numbers n, l, and m set the size, shape, and orientation: s orbitals are spherical, p orbitals have two lobes, d orbitals four. Brighter regions are higher probability density.</p>
      </div>}
      inspector={<div><Stat label="Orbital" value={ORBITALS[orb].label} /><Stat label="Principal n" value={String(ORBITALS[orb].n)} /><Stat label="Energy" value={`${(-13.6 / ORBITALS[orb].n ** 2).toFixed(2)} eV`} /></div>}
    ><canvas ref={canvasRef} width={400} height={400} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
