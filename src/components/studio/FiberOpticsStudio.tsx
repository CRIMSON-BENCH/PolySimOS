"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function FiberOpticsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [n1, setN1] = useState(1.48); // core
  const [n2, setN2] = useState(1.46); // cladding
  const [coreD, setCoreD] = useState(50); // um

  const critical = Math.asin(Math.min(1, n2 / n1)) * 180 / Math.PI;
  const NA = Math.sqrt(Math.max(0, n1 * n1 - n2 * n2)); const acceptance = Math.asin(Math.min(1, NA)) * 180 / Math.PI;
  const V = Math.PI * coreD * 1e-6 * NA / (1310e-9); const modes = V < 2.405 ? 1 : Math.round(V * V / 2);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 540, H = 240; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cy = H / 2, coreH = 60;
    ctx.fillStyle = "#1e3a5f"; ctx.fillRect(0, cy - coreH, W, coreH * 2);
    ctx.fillStyle = "#22d3ee"; ctx.globalAlpha = 0.15; ctx.fillRect(0, cy - coreH / 2, W, coreH); ctx.globalAlpha = 1;
    ctx.strokeStyle = "#475569"; ctx.beginPath(); ctx.moveTo(0, cy - coreH / 2); ctx.lineTo(W, cy - coreH / 2); ctx.moveTo(0, cy + coreH / 2); ctx.lineTo(W, cy + coreH / 2); ctx.stroke();
    // bouncing ray (TIR)
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); let x = 0, y = cy + coreH / 2, dir = -1; ctx.moveTo(x, y);
    const step = 60; while (x < W) { x += step; y += dir * coreH; if (y <= cy - coreH / 2) { y = cy - coreH / 2; dir = 1; } else if (y >= cy + coreH / 2) { y = cy + coreH / 2; dir = -1; } ctx.lineTo(x, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("core (higher n) — light trapped by total internal reflection", 10, 20); ctx.fillText("cladding", 10, cy - coreH - 4);
  }, [n1, n2, coreD]);

  return (
    <StudioChrome title="Fiber Optics" tagline="total internal reflection"
      controls={<div>
        <Slider label="Core index n₁" value={n1} min={1.4} max={1.6} step={0.005} onChange={setN1} />
        <Slider label="Cladding index n₂" value={n2} min={1.35} max={n1 - 0.005} step={0.005} onChange={setN2} />
        <Slider label="Core diameter (µm)" value={coreD} min={4} max={100} step={1} onChange={setCoreD} />
        <p className="mt-3 text-xs text-slate-500">An optical fiber traps light in a high-index core surrounded by lower-index cladding: rays hitting the boundary above the critical angle undergo total internal reflection and bounce down the fiber for kilometers. The numerical aperture sets the acceptance cone, and the core size decides whether it carries one mode (single-mode, for long-haul) or many (multimode).</p>
      </div>}
      inspector={<div><Stat label="Critical angle" value={`${critical.toFixed(1)}°`} /><Stat label="Numerical aperture" value={NA.toFixed(3)} /><Stat label="Acceptance angle" value={`${acceptance.toFixed(1)}°`} /><Stat label="Fiber type" value={modes <= 1 ? "single-mode" : `multimode (~${modes})`} /></div>}
    ><canvas ref={canvasRef} width={540} height={240} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
