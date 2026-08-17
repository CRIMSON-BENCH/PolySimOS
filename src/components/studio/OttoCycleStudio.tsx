"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Otto cycle (gasoline engine) efficiency vs compression ratio.
export function OttoCycleStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ratio, setRatio] = useState(9);
  const [gamma, setGamma] = useState(1.4);

  const eff = 1 - 1 / Math.pow(ratio, gamma - 1);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 500, H = 330; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, oy = H - 35, pw = W - 80, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const V1 = ratio, V2 = 1; const P1 = 1, P2 = P1 * Math.pow(V1 / V2, gamma); const P3 = P2 * 3, P4 = P3 * Math.pow(V2 / V1, gamma);
    const Vmax = ratio * 1.1, Pmax = P3 * 1.1; const X = (v: number) => ox + (v / Vmax) * pw; const Y = (p: number) => oy - (p / Pmax) * ph;
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let v = V1; v >= V2; v -= 0.05) { const p = P1 * Math.pow(V1 / v, gamma); v === V1 ? ctx.moveTo(X(v), Y(p)) : ctx.lineTo(X(v), Y(p)); } // compression
    ctx.lineTo(X(V2), Y(P3)); // combustion (const vol)
    for (let v = V2; v <= V1; v += 0.05) { const p = P3 * Math.pow(V2 / v, gamma); ctx.lineTo(X(v), Y(p)); } // expansion
    ctx.lineTo(X(V1), Y(P1)); ctx.closePath(); ctx.stroke(); ctx.fillStyle = "rgba(34,211,238,0.1)"; ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("Otto cycle (P-V)", ox + 6, oy - ph + 12); ctx.fillText("volume →", ox + pw - 60, oy + 18);
  }, [ratio, gamma]);

  return (
    <StudioChrome title="Otto Cycle (Engine)" tagline="gasoline engine efficiency"
      controls={<div>
        <Slider label="Compression ratio" value={ratio} min={4} max={14} step={0.5} onChange={setRatio} />
        <Slider label="Heat capacity ratio γ" value={gamma} min={1.3} max={1.67} step={0.01} onChange={setGamma} />
        <p className="mt-3 text-xs text-slate-500">The Otto cycle idealizes a gasoline engine: adiabatic compression, constant-volume combustion, adiabatic expansion (the power stroke), and exhaust. Its efficiency, η = 1 − 1/r^(γ−1), depends only on the compression ratio. Higher compression means more efficiency — until the fuel pre-ignites and knocks, which is why octane rating matters.</p>
      </div>}
      inspector={<div><Stat label="Efficiency" value={`${(eff * 100).toFixed(1)}%`} /><Stat label="Compression ratio" value={`${ratio}:1`} /><Stat label="γ" value={gamma.toFixed(2)} /></div>}
    ><canvas ref={canvasRef} width={500} height={330} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
