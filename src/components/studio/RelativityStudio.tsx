"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function RelativityStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [beta, setBeta] = useState(0.6); // v/c
  const gamma = 1 / Math.sqrt(1 - beta * beta);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 300; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // rest ruler + moving (contracted) ruler
    const restLen = 300, restY = 90, movY = 200; const ox = 60;
    ctx.strokeStyle = "#64748b"; ctx.lineWidth = 2; ctx.strokeRect(ox, restY, restLen, 30);
    for (let i = 0; i <= 10; i++) { const x = ox + i * restLen / 10; ctx.beginPath(); ctx.moveTo(x, restY); ctx.lineTo(x, restY + 8); ctx.stroke(); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("rest frame (proper length)", ox, restY - 8);
    const cLen = restLen / gamma; ctx.strokeStyle = "#22d3ee"; ctx.strokeRect(ox, movY, cLen, 30);
    for (let i = 0; i <= 10; i++) { const x = ox + i * cLen / 10; ctx.beginPath(); ctx.moveTo(x, movY); ctx.lineTo(x, movY + 8); ctx.stroke(); }
    ctx.fillStyle = "#67e8f9"; ctx.fillText(`moving at ${(beta * 100).toFixed(0)}% c — length contracted ×${(1 / gamma).toFixed(2)}`, ox, movY - 8);
    // clock
    ctx.fillStyle = "#f472b6"; ctx.fillText(`1 s of proper time = ${gamma.toFixed(2)} s to the observer`, ox, movY + 60);
  }, [beta, gamma]);

  const c = 299792458;
  return (
    <StudioChrome title="Special Relativity" tagline="time dilation & length contraction"
      controls={<div>
        <Slider label="Speed v (fraction of c)" value={beta} min={0} max={0.999} step={0.001} onChange={setBeta} />
        <div className="mt-3 flex flex-wrap gap-1">{[0.1, 0.5, 0.9, 0.99, 0.999].map((b) => <button key={b} onClick={() => setBeta(b)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-400">{b}c</button>)}</div>
        <p className="mt-3 text-xs text-slate-500">Near the speed of light, space and time warp. The Lorentz factor γ = 1/√(1−v²/c²) governs it all: moving clocks run slow by γ (time dilation), moving objects shrink along their motion by 1/γ (length contraction), and energy grows without bound. At everyday speeds γ ≈ 1, so we never notice.</p>
      </div>}
      inspector={<div><Stat label="Lorentz factor γ" value={gamma.toFixed(3)} /><Stat label="Time dilation" value={`×${gamma.toFixed(2)}`} /><Stat label="Length contraction" value={`×${(1 / gamma).toFixed(3)}`} /><Stat label="Speed" value={`${(beta * c / 1e6).toFixed(0)} Mm/s`} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
