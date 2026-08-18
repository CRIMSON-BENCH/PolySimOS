"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { waist: number; wavelength: number }> = {
  "HeNe pointer": { waist: 50, wavelength: 633 },
  "Tight focus": { waist: 10, wavelength: 532 },
  "Telecom fiber": { waist: 100, wavelength: 1550 },
  "Wide collimated": { waist: 200, wavelength: 800 },
};

export function GaussianBeamStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ waist, wavelength }, update] = useShareableNumbers({ waist: 50, wavelength: 633 });

  const w0 = waist * 1e-6; const lam = wavelength * 1e-9; const zR = Math.PI * w0 * w0 / lam; const div = lam / (Math.PI * w0) * 1000; // mrad

  useEffect(() => {
    const W = 540, H = 280; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cy = H / 2; const zMax = zR * 4; const scaleZ = W / (2 * zMax); const scaleW = 40 / w0;
    const wz = (z: number) => w0 * Math.sqrt(1 + (z / zR) ** 2);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2;
    for (const sign of [1, -1]) { ctx.beginPath(); for (let px = 0; px <= W; px++) { const z = (px - W / 2) / scaleZ; const w = wz(z) * scaleW; const y = cy - sign * Math.min(cy - 10, w); px ? ctx.lineTo(px, y) : ctx.moveTo(px, y); } ctx.stroke(); }
    ctx.fillStyle = "rgba(34,211,238,0.1)"; ctx.beginPath(); for (let px = 0; px <= W; px++) { const z = (px - W / 2) / scaleZ; const w = wz(z) * scaleW; ctx.lineTo(px, cy - Math.min(cy - 10, w)); } for (let px = W; px >= 0; px--) { const z = (px - W / 2) / scaleZ; const w = wz(z) * scaleW; ctx.lineTo(px, cy + Math.min(cy - 10, w)); } ctx.fill();
    // Rayleigh range markers
    ctx.strokeStyle = "#a3e635"; ctx.setLineDash([3, 3]); [zR, -zR].forEach((z) => { const px = W / 2 + z * scaleZ; ctx.beginPath(); ctx.moveTo(px, 10); ctx.lineTo(px, H - 10); ctx.stroke(); }); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("beam waist w₀ at center", W / 2 - 60, cy - 44); ctx.fillStyle = "#bef264"; ctx.fillText("±Rayleigh range", W / 2 + zR * scaleZ - 40, 22);
  }, [waist, wavelength]);

  const explain =
    waist <= 20
      ? "A tight waist buys a small spot but a large divergence — this beam spreads quickly once past its short Rayleigh range."
      : waist >= 150
      ? "A wide waist stays collimated far longer: the Rayleigh range grows with w₀², so this beam holds its width over a long distance."
      : wavelength >= 1200
      ? "Longer wavelengths diffract more, so at this near-infrared line the beam diverges faster than a visible beam of the same waist."
      : "Divergence is set by λ/(π·w₀): shrinking the waist or lengthening the wavelength both make the beam spread faster — the core diffraction trade-off.";

  const code = `import numpy as np
waist_um, wavelength_nm = ${waist}, ${wavelength}
w0 = waist_um * 1e-6
lam = wavelength_nm * 1e-9
zR = np.pi * w0**2 / lam          # Rayleigh range (m)
div = lam / (np.pi * w0) * 1000   # far-field divergence (mrad)
def w(z): return w0 * np.sqrt(1 + (z / zR)**2)
print("Rayleigh range (m):", zR)
print("divergence (mrad):", div)`;

  return (
    <StudioChrome title="Gaussian Beam" tagline="how a laser beam spreads"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Beam waist w₀ (µm)" value={waist} min={5} max={200} step={5} onChange={(v) => update({ waist: v })} />
        <Slider label="Wavelength (nm)" value={wavelength} min={400} max={1600} step={10} onChange={(v) => update({ wavelength: v })} />
        <p className="mt-3 text-xs text-slate-500">A real laser beam is not a perfect ray — it narrows to a minimum waist then spreads. Within one Rayleigh range of the waist it stays roughly collimated; beyond, it diverges at an angle set by wavelength over waist size. Tighter focus means faster spreading — the fundamental diffraction trade-off behind every laser and telescope.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Rayleigh range" value={zR < 0.01 ? `${(zR * 1000).toFixed(2)} mm` : `${zR.toFixed(3)} m`} /><Stat label="Divergence" value={`${div.toFixed(2)} mrad`} /><Stat label="Waist" value={`${waist} µm`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={280} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
