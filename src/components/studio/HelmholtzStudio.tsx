"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Helmholtz resonator: f = (c/2pi) sqrt(A/(V*Leff)).
const C = 343;
export function HelmholtzStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [volume, setVolume] = useState(500); // cm^3
  const [neckD, setNeckD] = useState(2); // cm diameter
  const [neckL, setNeckL] = useState(5); // cm

  const V = volume * 1e-6; const r = neckD / 2 * 1e-2; const A = Math.PI * r * r; const Leff = (neckL * 1e-2) + 1.7 * r;
  const f = (C / (2 * Math.PI)) * Math.sqrt(A / (V * Leff));

  useEffect(() => {
    const W = 420, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2; const bodyR = Math.cbrt(volume) * 4; const neckW = neckD * 8, neckH = neckL * 8;
    ctx.fillStyle = "rgba(34,211,238,0.18)"; ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, 210, bodyR, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(148,163,184,0.2)"; ctx.strokeStyle = "#64748b"; ctx.fillRect(cx - neckW / 2, 210 - bodyR - neckH, neckW, neckH); ctx.strokeRect(cx - neckW / 2, 210 - bodyR - neckH, neckW, neckH);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("air cavity (spring)", cx - 40, 210); ctx.fillText("neck (mass)", cx + neckW / 2 + 6, 210 - bodyR - neckH / 2);
  }, [volume, neckD, neckL]);

  return (
    <StudioChrome title="Helmholtz Resonator" tagline="the resonance of a bottle"
      controls={<div>
        <Slider label="Cavity volume (cm³)" value={volume} min={50} max={3000} step={50} onChange={setVolume} />
        <Slider label="Neck diameter (cm)" value={neckD} min={0.5} max={6} step={0.1} onChange={setNeckD} />
        <Slider label="Neck length (cm)" value={neckL} min={1} max={20} step={0.5} onChange={setNeckL} />
        <p className="mt-3 text-xs text-slate-500">Blow across a bottle and it sings at its Helmholtz frequency. The plug of air in the neck acts as a mass and the air in the cavity as a spring, giving f = (c/2π)√(A/VL). Bigger cavities and longer necks lower the pitch — the principle behind bass ports, mufflers, and ocarinas.</p>
      </div>}
      inspector={<div><Stat label="Resonant frequency" value={`${f.toFixed(0)} Hz`} /><Stat label="Wavelength" value={`${(C / f).toFixed(2)} m`} /><Stat label="Cavity" value={`${volume} cm³`} /></div>}
    ><canvas ref={canvasRef} width={420} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
