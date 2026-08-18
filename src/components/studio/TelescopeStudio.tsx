"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { aperture: number; focalObj: number; focalEye: number; wavelength: number }> = {
  "Beginner 6-inch": { aperture: 150, focalObj: 1200, focalEye: 25, wavelength: 550 },
  "Planetary": { aperture: 200, focalObj: 2000, focalEye: 6, wavelength: 550 },
  "Deep-sky": { aperture: 400, focalObj: 1600, focalEye: 30, wavelength: 550 },
  "Observatory": { aperture: 1000, focalObj: 4000, focalEye: 10, wavelength: 550 },
};

export function TelescopeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ aperture, focalObj, focalEye, wavelength }, update] = useShareableNumbers({
    aperture: 200, // mm
    focalObj: 1200, // mm
    focalEye: 10, // mm
    wavelength: 550, // nm
  });

  const resolutionArcsec = 1.22 * (wavelength * 1e-9) / (aperture / 1000) * 206265; // Rayleigh, arcsec
  const magnification = focalObj / focalEye;
  const lightGain = Math.pow(aperture / 7, 2); // vs 7mm eye pupil
  const limitingMag = 2.7 + 5 * Math.log10(aperture); // approx
  const maxUsefulMag = 2 * aperture; // ~2×/mm rule of thumb

  useEffect(() => {
    const W = 480, H = 240; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // two stars separated by the resolution limit — show Airy disks
    const sep = 60; const cx = W / 2, cy = H / 2; const airy = Math.max(4, 2000 / aperture);
    for (const dx of [-sep / 2, sep / 2]) { const g = ctx.createRadialGradient(cx + dx, cy, 0, cx + dx, cy, airy * 3); g.addColorStop(0, "#fff"); g.addColorStop(0.3, "#67e8f9"); g.addColorStop(1, "rgba(103,232,249,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx + dx, cy, airy * 3, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`Airy disk size ∝ 1/aperture — bigger aperture, sharper split`, 20, H - 14);
  }, [aperture]);

  const explain = magnification > maxUsefulMag
    ? `At ${magnification.toFixed(0)}× you are past the ~${maxUsefulMag}× that a ${aperture} mm aperture can actually resolve, so the view only grows dimmer and blurrier — empty magnification.`
    : magnification < aperture / 4
    ? `A wide, low-power ${magnification.toFixed(0)}× view: bright and forgiving for framing large deep-sky objects, with the ${resolutionArcsec.toFixed(2)}″ resolving limit held in reserve.`
    : `Well matched: ${magnification.toFixed(0)}× sits under the ${maxUsefulMag}× ceiling, so the ${resolutionArcsec.toFixed(2)}″ resolving power of this aperture actually shows real detail.`;

  const code = `import numpy as np
aperture, focal_obj, focal_eye, wavelength = ${aperture}, ${focalObj}, ${focalEye}, ${wavelength}
resolution = 1.22 * (wavelength * 1e-9) / (aperture / 1000) * 206265  # arcsec
magnification = focal_obj / focal_eye
light_gain = (aperture / 7) ** 2          # vs 7 mm eye pupil
limiting_mag = 2.7 + 5 * np.log10(aperture)
print(resolution, magnification, light_gain, limiting_mag)`;

  return (
    <StudioChrome title="Telescope Optics" tagline="resolution · magnification · light grasp"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Aperture (mm)" value={aperture} min={50} max={1000} step={10} onChange={(v) => update({ aperture: v })} />
        <Slider label="Objective focal length (mm)" value={focalObj} min={400} max={4000} step={50} onChange={(v) => update({ focalObj: v })} />
        <Slider label="Eyepiece focal length (mm)" value={focalEye} min={4} max={40} step={1} onChange={(v) => update({ focalEye: v })} />
        <Slider label="Wavelength (nm)" value={wavelength} min={400} max={700} step={10} onChange={(v) => update({ wavelength: v })} />
        <p className="mt-3 text-xs text-slate-500">Aperture rules everything: resolving power is θ = 1.22·λ/D (Rayleigh criterion), light-gathering scales as D², and the faintest visible star climbs with aperture. Magnification is just objective focal length divided by eyepiece focal length — and is useless beyond what the aperture can resolve.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Resolution" value={`${resolutionArcsec.toFixed(2)}″`} /><Stat label="Magnification" value={`${magnification.toFixed(0)}×`} /><Stat label="Light vs eye" value={`${lightGain.toFixed(0)}×`} /><Stat label="Limiting mag" value={limitingMag.toFixed(1)} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={480} height={240} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
