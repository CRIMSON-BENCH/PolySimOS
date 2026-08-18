"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function PipeFlowStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [D, setD] = useState(0.1), [L, setL] = useState(50), [Q, setQ] = useState(0.01), [eps, setEps] = useState(0.045);
  const A = Math.PI * D * D / 4, v = Q / A, Re = v * D / 1e-6, rel = eps / 1000 / D;
  const f = Re < 2300 ? 64 / Re : 0.25 / Math.pow(Math.log10(rel / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
  const hf = f * (L / D) * v * v / (2 * 9.81), dp = 1000 * 9.81 * hf / 1000;

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const py = H / 2, pr = Math.max(10, Math.min(60, D * 300));
    ctx.fillStyle = "#0e7490"; ctx.fillRect(30, py - pr, W - 60, pr * 2);
    ctx.strokeStyle = "#67e8f9"; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const x = 60 + i * 70; ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + 30, py); ctx.lineTo(x + 22, py - 6); ctx.moveTo(x + 30, py); ctx.lineTo(x + 22, py + 6); ctx.stroke(); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(Re < 2300 ? "laminar flow" : "turbulent flow", 34, 24); ctx.fillText(`pressure drops ${dp.toFixed(1)} kPa over ${L} m`, 34, H - 16);
  }, [D, L, Q, eps, Re, dp]);

  return (
    <StudioChrome title="Pipe Flow & Head Loss" tagline="Darcy–Weisbach friction"
      controls={<div>
        <Slider label="Diameter (m)" value={D} min={0.02} max={0.5} step={0.01} onChange={setD} />
        <Slider label="Length (m)" value={L} min={5} max={500} step={5} onChange={setL} />
        <Slider label="Flow rate (m³/s)" value={Q} min={0.001} max={0.1} step={0.001} onChange={setQ} />
        <Slider label="Roughness ε (mm)" value={eps} min={0.001} max={3} step={0.001} onChange={setEps} />
        <p className="mt-3 text-xs text-slate-500">Friction turns pressure into heat as fluid moves through a pipe. Head loss h_f = f·(L/D)·v²/2g, where the friction factor f depends on the Reynolds number and pipe roughness. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Velocity" value={`${v.toFixed(2)} m/s`} />
        <Stat label="Reynolds number" value={Re.toExponential(2)} />
        <Stat label="Friction factor f" value={f.toFixed(4)} />
        <Stat label="Head loss" value={`${hf.toFixed(2)} m`} />
        <Stat label="Pressure drop" value={`${dp.toFixed(1)} kPa`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
