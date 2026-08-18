"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Distributed Bragg reflector reflectivity.
export function BraggMirrorStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pairs, setPairs] = useState(8);
  const [nH, setNH] = useState(2.3);
  const [nL, setNL] = useState(1.45);
  const lam0 = 550;

  // peak reflectivity of a quarter-wave stack (n0=air, ns=glass)
  const n0 = 1, ns = 1.5; const N = Math.round(pairs);
  const ratio = Math.pow(nL / nH, 2 * N); const num = n0 * Math.pow(nH, 2 * N) - ns * Math.pow(nL, 2 * N);
  const den = n0 * Math.pow(nH, 2 * N) + ns * Math.pow(nL, 2 * N); const R = (num / den) ** 2;
  const stopband = 4 / Math.PI * Math.asin((nH - nL) / (nH + nL)) * lam0;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // reflectivity spectrum (schematic: flat-top stopband centered at lam0)
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= pw; i++) { const lam = 350 + (i / pw) * 400; const detune = Math.abs(lam - lam0) / (stopband / 2); const r = R / (1 + Math.pow(detune, 2 * N)); const y = oy - r * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("reflectivity vs wavelength", ox + 6, oy - ph + 12); ctx.fillText("stopband →", ox + pw / 2 - 30, oy - ph + 26);
    // layer stack graphic
    for (let i = 0; i < Math.min(N, 12); i++) { ctx.fillStyle = "#1e3a5f"; ctx.fillRect(ox + i * 16, oy - ph - 24, 8, 16); ctx.fillStyle = "#334155"; ctx.fillRect(ox + i * 16 + 8, oy - ph - 24, 8, 16); }
  }, [pairs, nH, nL]);

  return (
    <StudioChrome title="Bragg Mirror (DBR)" tagline="a mirror from interference"
      controls={<div>
        <Slider label="Layer pairs" value={pairs} min={2} max={30} step={1} onChange={setPairs} />
        <Slider label="High index n_H" value={nH} min={1.8} max={3.5} step={0.05} onChange={setNH} />
        <Slider label="Low index n_L" value={nL} min={1.3} max={1.8} step={0.05} onChange={setNL} />
        <p className="mt-3 text-xs text-slate-500">A distributed Bragg reflector stacks alternating quarter-wave layers of high and low index. Their reflections add up in phase over a band of wavelengths — the stopband — creating a mirror that can exceed 99.99% reflectivity, far better than metal. More layer pairs and higher index contrast deepen the reflectivity. Used in lasers, fiber gratings, and dielectric mirrors.</p>
      </div>}
      inspector={<div><Stat label="Peak reflectivity" value={`${(R * 100).toFixed(3)}%`} /><Stat label="Layer pairs" value={String(Math.round(pairs))} /><Stat label="Stopband width" value={`${stopband.toFixed(0)} nm`} /></div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
