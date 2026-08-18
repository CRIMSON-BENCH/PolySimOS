"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function TelescopeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aperture, setAperture] = useState(200); // mm
  const [focalObj, setFocalObj] = useState(1200); // mm
  const [focalEye, setFocalEye] = useState(10); // mm
  const [wavelength, setWavelength] = useState(550); // nm

  const resolutionArcsec = 1.22 * (wavelength * 1e-9) / (aperture / 1000) * 206265; // Rayleigh, arcsec
  const magnification = focalObj / focalEye;
  const lightGain = Math.pow(aperture / 7, 2); // vs 7mm eye pupil
  const limitingMag = 2.7 + 5 * Math.log10(aperture); // approx

  useEffect(() => {
    const W = 480, H = 240; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // two stars separated by the resolution limit — show Airy disks
    const sep = 60; const cx = W / 2, cy = H / 2; const airy = Math.max(4, 2000 / aperture);
    for (const dx of [-sep / 2, sep / 2]) { const g = ctx.createRadialGradient(cx + dx, cy, 0, cx + dx, cy, airy * 3); g.addColorStop(0, "#fff"); g.addColorStop(0.3, "#67e8f9"); g.addColorStop(1, "rgba(103,232,249,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx + dx, cy, airy * 3, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`Airy disk size ∝ 1/aperture — bigger aperture, sharper split`, 20, H - 14);
  }, [aperture]);

  return (
    <StudioChrome title="Telescope Optics" tagline="resolution · magnification · light grasp"
      controls={<div>
        <Slider label="Aperture (mm)" value={aperture} min={50} max={1000} step={10} onChange={setAperture} />
        <Slider label="Objective focal length (mm)" value={focalObj} min={400} max={4000} step={50} onChange={setFocalObj} />
        <Slider label="Eyepiece focal length (mm)" value={focalEye} min={4} max={40} step={1} onChange={setFocalEye} />
        <Slider label="Wavelength (nm)" value={wavelength} min={400} max={700} step={10} onChange={setWavelength} />
        <p className="mt-3 text-xs text-slate-500">Aperture rules everything: resolving power is θ = 1.22·λ/D (Rayleigh criterion), light-gathering scales as D², and the faintest visible star climbs with aperture. Magnification is just objective focal length divided by eyepiece focal length — and is useless beyond what the aperture can resolve.</p>
      </div>}
      inspector={<div><Stat label="Resolution" value={`${resolutionArcsec.toFixed(2)}″`} /><Stat label="Magnification" value={`${magnification.toFixed(0)}×`} /><Stat label="Light vs eye" value={`${lightGain.toFixed(0)}×`} /><Stat label="Limiting mag" value={limitingMag.toFixed(1)} /></div>}
    ><canvas ref={canvasRef} width={480} height={240} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
