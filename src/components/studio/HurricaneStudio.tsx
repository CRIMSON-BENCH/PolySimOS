"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function HurricaneStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pressure, setPressure] = useState(950); // central mbar
  const [running, setRunning] = useState(true);
  const rot = useRef(0);

  const deficit = 1013 - pressure; const maxWind = 6.3 * Math.sqrt(deficit); // m/s approx
  const kmh = maxWind * 3.6; const mph = maxWind * 2.237;
  const cat = mph >= 157 ? 5 : mph >= 130 ? 4 : mph >= 111 ? 3 : mph >= 96 ? 2 : mph >= 74 ? 1 : 0;

  useEffect(() => {
    if (!running) return; let raf = 0;
    const loop = () => {
      rot.current += 0.02 + deficit / 5000; const ctx = canvasRef.current!.getContext("2d")!; const W = 400, H = 380; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2; const size = 60 + deficit * 1.2;
      // spiral bands
      for (let arm = 0; arm < 5; arm++) { ctx.strokeStyle = `rgba(34,211,238,${0.5 - arm * 0.06})`; ctx.lineWidth = 6; ctx.beginPath(); for (let t = 0; t < 6; t += 0.1) { const r = 12 + t * size / 6; const a = t * 1.6 + rot.current + arm * 1.256; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
      // eye
      ctx.fillStyle = "#0b1220"; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 7); ctx.fill(); ctx.strokeStyle = "#f472b6"; ctx.stroke();
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`Category ${cat} — eye at center`, 12, 20);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [pressure, running]);

  return (
    <StudioChrome title="Hurricane Wind Model" tagline="pressure drives the wind"
      controls={<div>
        <Slider label="Central pressure (mbar)" value={pressure} min={880} max={1005} step={1} onChange={setPressure} />
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">A hurricane is a giant heat engine whose winds are driven by the pressure drop at its center — the deeper the low, the fiercer the winds, roughly as the square root of the pressure deficit. The calm eye sits in the middle, ringed by the eyewall of strongest wind. Central pressure is the single best predictor of a storm&apos;s intensity.</p>
      </div>}
      inspector={<div><Stat label="Pressure deficit" value={`${deficit} mbar`} /><Stat label="Max wind" value={`${kmh.toFixed(0)} km/h`} /><Stat label="Max wind (mph)" value={`${mph.toFixed(0)} mph`} /><Stat label="Saffir-Simpson" value={cat === 0 ? "tropical storm" : `Category ${cat}`} /></div>}
    ><canvas ref={canvasRef} width={400} height={380} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
