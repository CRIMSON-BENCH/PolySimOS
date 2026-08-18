"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 760, H = 480;

export function DoubleSlitStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [d, setD] = useState(40);       // slit separation
  const [a, setA] = useState(8);        // slit width
  const [lambda, setLambda] = useState(20); // wavelength

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const L = 800; // screen distance
    const intensity = (y: number) => {
      const theta = Math.atan2(y, L);
      const beta = (Math.PI * a * Math.sin(theta)) / lambda;
      const alpha = (Math.PI * d * Math.sin(theta)) / lambda;
      const sinc = beta === 0 ? 1 : Math.sin(beta) / beta;
      return sinc * sinc * Math.cos(alpha) * Math.cos(alpha);
    };
    // fringe band (top) + intensity curve (bottom)
    for (let px = 0; px < W; px++) { const y = (px - W / 2) * 0.6; const I = intensity(y); const c = Math.round(I * 255); ctx.fillStyle = `rgb(${Math.round(c * 0.2)},${Math.round(c * 0.85)},${c})`; ctx.fillRect(px, 0, 1, 140); }
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let px = 0; px < W; px++) { const y = (px - W / 2) * 0.6; const I = intensity(y); const yy = H - 20 - I * (H - 200); px ? ctx.lineTo(px, yy) : ctx.moveTo(px, yy); }
    ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("intensity on screen", 16, 168); ctx.fillText("interference + diffraction envelope", 16, H - 10);
  }, [d, a, lambda]);

  return (
    <StudioChrome title="Double-Slit Experiment" tagline="wave interference + diffraction"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">The iconic experiment: two slits create interference fringes, modulated by each slit&apos;s diffraction envelope.</p>
        <Slider label="Slit separation d" value={d} min={15} max={80} step={1} onChange={setD} />
        <Slider label="Slit width a" value={a} min={2} max={30} step={1} onChange={setA} />
        <Slider label="Wavelength λ" value={lambda} min={8} max={40} step={1} onChange={setLambda} />
      </div>}
      inspector={<div><Stat label="Fringe spacing" value={`∝ λ/d`} /><Stat label="Envelope" value={`∝ λ/a`} /><Stat label="Regime" value={d > a ? "interference-dominated" : "diffraction-dominated"} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
