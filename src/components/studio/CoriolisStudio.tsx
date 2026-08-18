"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Coriolis deflection on a rotating planet (rotating-frame view).
export function CoriolisStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [latitude, setLatitude] = useState(45);
  const [running, setRunning] = useState(true);
  const [hemisphere, setHemisphere] = useState(1); // 1 = N, -1 = S

  useEffect(() => {
    if (!running) return; let raf = 0; const f = 2 * 0.02 * Math.sin(latitude * Math.PI / 180) * hemisphere; // Coriolis param scaled
    let x = 270, y = 340, vx = 0, vy = -3; const trail: [number, number][] = [];
    const ctx = hidpi(canvasRef.current!, 540, 380);
    const loop = () => {
      for (let k = 0; k < 2; k++) { const ax = f * vy, ay = -f * vx; vx += ax; vy += ay; x += vx; y += vy; if (x < 10 || x > 530 || y < 10 || y > 370) { x = 270; y = 340; vx = 0; vy = -3; trail.length = 0; } trail.push([x, y]); if (trail.length > 400) trail.shift(); }
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 540, 380);
      ctx.strokeStyle = "#334155"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(270, 340); ctx.lineTo(270, 10); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); trail.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
      ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill();
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("intended path (dashed) vs actual (curved)", 12, 20);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [latitude, running, hemisphere]);

  return (
    <StudioChrome title="Coriolis Effect" tagline="why winds and currents curve"
      controls={<div>
        <Slider label="Latitude (°)" value={latitude} min={0} max={90} step={1} onChange={setLatitude} />
        <div className="mt-3 flex gap-2"><button onClick={() => setHemisphere(1)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold ${hemisphere === 1 ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>Northern</button><button onClick={() => setHemisphere(-1)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold ${hemisphere === -1 ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>Southern</button></div>
        <button onClick={() => setRunning((r) => !r)} className="mt-2 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">On a spinning planet, anything moving freely appears to curve — right in the Northern Hemisphere, left in the Southern. This Coriolis deflection is zero at the equator and strongest at the poles. It steers winds, ocean currents, and the rotation of hurricanes, and it is why weather systems spin.</p>
      </div>}
      inspector={<div><Stat label="Latitude" value={`${latitude}°`} /><Stat label="Deflection" value={hemisphere === 1 ? "to the right" : "to the left"} /><Stat label="Strength" value={latitude === 0 ? "zero (equator)" : `${(Math.sin(latitude * Math.PI / 180) * 100).toFixed(0)}%`} /></div>}
    ><canvas ref={canvasRef} width={540} height={380} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
