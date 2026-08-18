"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 440;

const PRESETS: Record<string, { slits: number; spacing: number; lambda: number }> = {
  "Two slits": { slits: 2, spacing: 30, lambda: 20 },
  "Fine grating": { slits: 20, spacing: 30, lambda: 20 },
  "Long wavelength": { slits: 8, spacing: 40, lambda: 38 },
  "Dense grating": { slits: 30, spacing: 50, lambda: 15 },
};

export function DiffractionGratingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ slits, spacing, lambda }, update] = useShareableNumbers({ slits: 5, spacing: 30, lambda: 20 });

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const inten = (theta: number) => { const phi = Math.PI * spacing * Math.sin(theta) / lambda; if (Math.abs(Math.sin(phi)) < 1e-6) return 1; const v = Math.sin(slits * phi) / (slits * Math.sin(phi)); return v * v; };
    for (let px = 0; px < W; px++) { const theta = ((px - W / 2) / W) * 1.6; const I = inten(theta); const c = Math.round(I * 255); ctx.fillStyle = `rgb(${c * 0.2},${c * 0.85},${c})`; ctx.fillRect(px, 0, 1, 120); }
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let px = 0; px < W; px++) { const theta = ((px - W / 2) / W) * 1.6; const y = H - 20 - inten(theta) * (H - 180); px ? ctx.lineTo(px, y) : ctx.moveTo(px, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`${slits} slits — sharper, brighter maxima as slit count grows`, 14, 150);
  }, [slits, spacing, lambda]);

  const explain = `The bright maxima stay locked where d·sinθ = mλ — fixed by spacing and wavelength, not slit count — but with ${slits} slits each principal peak is about ${slits}× narrower and far more intense, which is how a grating resolves fine spectral lines.`;

  const code = `import numpy as np
N, d, lam = ${slits}, ${spacing}, ${lambda}
theta = np.linspace(-0.8, 0.8, 760)
phi = np.pi * d * np.sin(theta) / lam
I = (np.sin(N * phi) / (N * np.sin(phi))) ** 2
print("peak intensity", np.nanmax(I))`;

  return (
    <StudioChrome title="Diffraction Grating" tagline="N-slit interference"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">More slits make the bright maxima sharper and brighter — the principle behind spectrometers that split light into precise spectral lines.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Number of slits" value={slits} min={2} max={30} step={1} onChange={(v) => update({ slits: v })} />
        <Slider label="Slit spacing" value={spacing} min={15} max={60} step={1} onChange={(v) => update({ spacing: v })} />
        <Slider label="Wavelength" value={lambda} min={10} max={40} step={1} onChange={(v) => update({ lambda: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Slits" value={String(slits)} /><Stat label="Resolution" value="∝ N" /><Stat label="Maxima at" value="d·sinθ = mλ" /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
