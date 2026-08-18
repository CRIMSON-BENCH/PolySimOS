"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Fraunhofer single-slit diffraction.
export function SingleSlitStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [slit, setSlit] = useState(20); // um
  const [wavelength, setWavelength] = useState(550); // nm

  const a = slit * 1e-6; const lam = wavelength * 1e-9; const firstMin = Math.asin(Math.min(1, lam / a)) * 180 / Math.PI;

  useEffect(() => {
    const W = 540, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 20, oy = H - 40, pw = W - 40, ph = H - 70; const angMax = 30 * Math.PI / 180;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= pw; i++) { const theta = ((i / pw) - 0.5) * 2 * angMax; const beta = Math.PI * a * Math.sin(theta) / lam; const I = beta === 0 ? 1 : (Math.sin(beta) / beta) ** 2; const y = oy - I * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    // intensity strip
    for (let i = 0; i < pw; i++) { const theta = ((i / pw) - 0.5) * 2 * angMax; const beta = Math.PI * a * Math.sin(theta) / lam; const I = beta === 0 ? 1 : (Math.sin(beta) / beta) ** 2; const hue = 280 - (wavelength - 400) / 400 * 280; ctx.fillStyle = `hsl(${hue},80%,${I * 55}%)`; ctx.fillRect(ox + i, oy + 6, 1, 16); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("single-slit diffraction pattern", ox + 6, 18);
  }, [slit, wavelength]);

  return (
    <StudioChrome title="Single-Slit Diffraction" tagline="light bending around edges"
      controls={<div>
        <Slider label="Slit width (µm)" value={slit} min={2} max={100} step={1} onChange={setSlit} />
        <Slider label="Wavelength (nm)" value={wavelength} min={400} max={750} step={10} onChange={setWavelength} />
        <p className="mt-3 text-xs text-slate-500">Send light through a narrow slit and it fans out into a bright central band flanked by dimmer fringes — diffraction. The pattern follows a sinc-squared curve, with the first dark fringe where the path difference across the slit equals one wavelength. Narrower slits spread the light more, the diffraction limit that caps every lens and telescope&apos;s sharpness.</p>
      </div>}
      inspector={<div><Stat label="First minimum" value={`${firstMin.toFixed(1)}°`} /><Stat label="Central width" value={`${(2 * firstMin).toFixed(1)}°`} /><Stat label="Slit/λ" value={(a / lam).toFixed(1)} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
