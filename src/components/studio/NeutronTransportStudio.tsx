"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Neutron random walk / moderation.
export function NeutronTransportStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mfp, setMfp] = useState(30); // mean free path px
  const [seed, setSeed] = useState(1);
  const [escaped, setEscaped] = useState(0);

  useEffect(() => {
    const W = 400, H = 400; let s = seed * 3571 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#334155"; ctx.strokeRect(40, 40, W - 80, H - 80);
    let esc = 0, absorbed = 0; const N = 40;
    for (let p = 0; p < N; p++) { let x = W / 2, y = H / 2; let energy = 2e6; ctx.strokeStyle = `hsla(${180 + p * 4},70%,55%,0.5)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y);
      for (let step = 0; step < 40; step++) { const ang = rnd() * 6.283; const d = -mfp * Math.log(rnd()); x += Math.cos(ang) * d; y += Math.sin(ang) * d; ctx.lineTo(x, y); energy *= 0.6; // moderation
        if (x < 40 || x > W - 40 || y < 40 || y > H - 40) { esc++; break; } if (energy < 0.025 && rnd() < 0.3) { absorbed++; ctx.fillStyle = "#f472b6"; ctx.fillRect(x - 2, y - 2, 4, 4); break; } }
      ctx.stroke(); }
    setEscaped(esc);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("neutron paths — scatter, slow, absorb or escape", 44, 30);
  }, [mfp, seed]);

  return (
    <StudioChrome title="Neutron Transport" tagline="random walk & moderation"
      controls={<div>
        <Slider label="Mean free path (px)" value={mfp} min={8} max={80} step={2} onChange={setMfp} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">New neutrons</button>
        <p className="mt-3 text-xs text-slate-500">Neutrons do not travel straight — they random-walk through matter, scattering every mean free path and losing energy at each collision. This moderation slows fast neutrons to thermal speeds where they fission efficiently. A short mean free path (dense material) keeps them inside; a long one lets them leak out, which is why reactor size and geometry set criticality.</p>
      </div>}
      inspector={<div><Stat label="Mean free path" value={`${mfp} px`} /><Stat label="Escaped" value={`${escaped} / 40`} /><Stat label="Leakage" value={`${(escaped / 40 * 100).toFixed(0)}%`} /></div>}
    ><canvas ref={canvasRef} width={400} height={400} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
