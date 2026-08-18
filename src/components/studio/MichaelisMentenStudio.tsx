"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function MichaelisMentenStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [Vmax, setVmax] = useState(100), [Km, setKm] = useState(5), [S, setS] = useState(5);
  const v = Vmax * S / (Km + S);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55, Smax = Km * 8;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // Vmax asymptote
    ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(ox, oy - ph * 0.92); ctx.lineTo(ox + pw, oy - ph * 0.92); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const s = Smax * i / pw; const y = oy - (Vmax * s / (Km + s)) / Vmax * ph * 0.92; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    // Km marker (half Vmax)
    const kx = ox + (Km / Smax) * pw; ctx.strokeStyle = "#f472b6"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(kx, oy); ctx.lineTo(kx, oy - ph * 0.46); ctx.stroke(); ctx.setLineDash([]);
    const px = ox + (Math.min(S, Smax) / Smax) * pw, py = oy - (v / Vmax) * ph * 0.92; ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("reaction rate vs substrate — saturates at Vmax", ox + 6, oy - ph + 12); ctx.fillText("[S] →", ox + pw - 40, oy + 18); ctx.fillText("Km", kx - 6, oy - ph * 0.46 - 6);
  }, [Vmax, Km, S, v]);

  return (
    <StudioChrome title="Michaelis–Menten Enzyme Kinetics" tagline="how enzymes saturate"
      controls={<div>
        <Slider label="Vmax (µmol/min)" value={Vmax} min={10} max={300} step={10} onChange={setVmax} />
        <Slider label="Km (mM)" value={Km} min={0.5} max={30} step={0.5} onChange={setKm} />
        <Slider label="Substrate [S] (mM)" value={S} min={0.1} max={60} step={0.1} onChange={setS} />
        <p className="mt-3 text-xs text-slate-500">Enzymes speed reactions but saturate: as substrate rises, the rate approaches a ceiling Vmax. Km — the substrate level giving half Vmax — measures how tightly the enzyme binds. Low Km means high affinity. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Reaction rate v" value={`${v.toFixed(1)} µmol/min`} />
        <Stat label="Fraction of Vmax" value={`${(v / Vmax * 100).toFixed(0)}%`} />
        <Stat label="Km (half-Vmax [S])" value={`${Km} mM`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
