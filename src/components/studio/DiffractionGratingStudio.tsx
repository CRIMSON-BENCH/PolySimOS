"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 760, H = 440;

export function DiffractionGratingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [slits, setSlits] = useState(5);
  const [spacing, setSpacing] = useState(30);
  const [lambda, setLambda] = useState(20);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const inten = (theta: number) => { const phi = Math.PI * spacing * Math.sin(theta) / lambda; if (Math.abs(Math.sin(phi)) < 1e-6) return 1; const v = Math.sin(slits * phi) / (slits * Math.sin(phi)); return v * v; };
    for (let px = 0; px < W; px++) { const theta = ((px - W / 2) / W) * 1.6; const I = inten(theta); const c = Math.round(I * 255); ctx.fillStyle = `rgb(${c * 0.2},${c * 0.85},${c})`; ctx.fillRect(px, 0, 1, 120); }
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let px = 0; px < W; px++) { const theta = ((px - W / 2) / W) * 1.6; const y = H - 20 - inten(theta) * (H - 180); px ? ctx.lineTo(px, y) : ctx.moveTo(px, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`${slits} slits — sharper, brighter maxima as slit count grows`, 14, 150);
  }, [slits, spacing, lambda]);

  return (
    <StudioChrome title="Diffraction Grating" tagline="N-slit interference"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">More slits make the bright maxima sharper and brighter — the principle behind spectrometers that split light into precise spectral lines.</p>
        <Slider label="Number of slits" value={slits} min={2} max={30} step={1} onChange={setSlits} />
        <Slider label="Slit spacing" value={spacing} min={15} max={60} step={1} onChange={setSpacing} />
        <Slider label="Wavelength" value={lambda} min={10} max={40} step={1} onChange={setLambda} />
      </div>}
      inspector={<div><Stat label="Slits" value={String(slits)} /><Stat label="Resolution" value="∝ N" /><Stat label="Maxima at" value="d·sinθ = mλ" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
