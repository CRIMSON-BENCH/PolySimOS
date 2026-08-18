"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Ballistic reentry: velocity vs altitude, peak g-load.
export function ReentryStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(5); // entry flight-path angle deg
  const [beta, setBeta] = useState(400); // ballistic coefficient kg/m^2
  const [peakG, setPeakG] = useState(0);

  useEffect(() => {
    const W = 500, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const rho0 = 1.225, Hs = 7200; const g = 9.81; let V = 7800; let alt = 120000; const gamma = angle * Math.PI / 180; const dt = 0.5;
    const pts: [number, number][] = []; const gpts: [number, number][] = []; let maxG = 0;
    for (let t = 0; t < 600 && alt > 0; t++) { const rho = rho0 * Math.exp(-alt / Hs); const drag = 0.5 * rho * V * V / beta; const decel = drag; if (decel / g > maxG) maxG = decel / g;
      V -= decel * dt; alt -= V * Math.sin(gamma) * dt; if (V < 200) break; pts.push([V, alt]); gpts.push([decel / g, alt]); }
    setPeakG(maxG);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const X = (v: number) => ox + (v / 8000) * pw * 0.6; const Y = (a: number) => oy - (a / 120000) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); pts.forEach(([v, a], i) => (i ? ctx.lineTo(X(v), Y(a)) : ctx.moveTo(X(v), Y(a)))); ctx.stroke();
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); gpts.forEach(([gg, a], i) => { const gx = ox + pw * 0.62 + (gg / (maxG * 1.1)) * pw * 0.35; (i ? ctx.lineTo(gx, Y(a)) : ctx.moveTo(gx, Y(a))); }); ctx.stroke();
    ctx.fillStyle = "#67e8f9"; ctx.font = "11px sans-serif"; ctx.fillText("velocity", ox + 6, oy - ph + 12); ctx.fillStyle = "#f9a8d4"; ctx.fillText("g-load", ox + pw * 0.66, oy - ph + 12); ctx.fillStyle = "#94a3b8"; ctx.save(); ctx.translate(16, oy - ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("altitude", -22, 0); ctx.restore();
  }, [angle, beta]);

  return (
    <StudioChrome title="Atmospheric Reentry" tagline="the fire of coming home"
      controls={<div>
        <Slider label="Entry angle (°)" value={angle} min={1} max={12} step={0.5} onChange={setAngle} />
        <Slider label="Ballistic coefficient (kg/m²)" value={beta} min={50} max={800} step={10} onChange={setBeta} />
        <p className="mt-3 text-xs text-slate-500">A returning spacecraft sheds nearly all its 7.8 km/s orbital speed as heat in the upper atmosphere. Too shallow an angle and it skips back into space; too steep and the deceleration g-load and heating spike to lethal levels. The ballistic coefficient sets how deep it plunges before the thickening air finally slows it.</p>
      </div>}
      inspector={<div><Stat label="Peak deceleration" value={`${peakG.toFixed(1)} g`} /><Stat label="Entry angle" value={`${angle}°`} /><Stat label="Survivable?" value={peakG < 12 ? "yes" : "extreme"} /></div>}
    ><canvas ref={canvasRef} width={500} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
