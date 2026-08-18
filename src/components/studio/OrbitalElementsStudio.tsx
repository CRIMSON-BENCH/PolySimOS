"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Visualize an orbit from semi-major axis and eccentricity.
export function OrbitalElementsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sma, setSma] = useState(10000); // km
  const [ecc, setEcc] = useState(0.4);
  const [argp, setArgp] = useState(30); // arg of periapsis deg
  const [running, setRunning] = useState(true);
  const theta = useRef(0);

  const Re = 6371; const mu = 398600;
  const period = 2 * Math.PI * Math.sqrt(sma ** 3 / mu); // s
  const apo = sma * (1 + ecc) - Re; const peri = sma * (1 - ecc) - Re;

  useEffect(() => {
    if (!running) return; let raf = 0;
    const loop = () => {
      theta.current += 0.02; const W = 420, H = 380; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2; const scale = 150 / (sma * (1 + ecc));
      // Earth
      ctx.fillStyle = "#1e40af"; ctx.beginPath(); ctx.arc(cx, cy, Re * scale, 0, 7); ctx.fill();
      // orbit ellipse: focus at Earth
      const a = sma * scale, b = a * Math.sqrt(1 - ecc * ecc), cshift = a * ecc; const w = argp * Math.PI / 180;
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let e = 0; e <= 6.29; e += 0.05) { const x = a * Math.cos(e) - cshift, y = b * Math.sin(e); const rx = x * Math.cos(w) - y * Math.sin(w), ry = x * Math.sin(w) + y * Math.cos(w); e === 0 ? ctx.moveTo(cx + rx, cy + ry) : ctx.lineTo(cx + rx, cy + ry); } ctx.closePath(); ctx.stroke();
      // satellite position
      const e = theta.current; const x = a * Math.cos(e) - cshift, y = b * Math.sin(e); const rx = x * Math.cos(w) - y * Math.sin(w), ry = x * Math.sin(w) + y * Math.cos(w);
      ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(cx + rx, cy + ry, 5, 0, 7); ctx.fill();
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("orbit (focus = Earth center)", 12, 20);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [sma, ecc, argp, running]);

  return (
    <StudioChrome title="Orbital Elements" tagline="the shape of an orbit"
      controls={<div>
        <Slider label="Semi-major axis (km)" value={sma} min={7000} max={42000} step={500} onChange={setSma} />
        <Slider label="Eccentricity" value={ecc} min={0} max={0.85} step={0.02} onChange={setEcc} />
        <Slider label="Arg. of periapsis (°)" value={argp} min={0} max={360} step={10} onChange={setArgp} />
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">An orbit&apos;s size and shape come from two numbers: the semi-major axis sets the period (and average altitude), and the eccentricity sets how elongated the ellipse is. Earth sits at one focus, so the satellite races through its low perigee and crawls at its high apogee — Kepler&apos;s second law in motion. The argument of periapsis rotates the ellipse.</p>
      </div>}
      inspector={<div><Stat label="Period" value={`${(period / 60).toFixed(0)} min`} /><Stat label="Apogee alt." value={`${apo.toFixed(0)} km`} /><Stat label="Perigee alt." value={`${peri.toFixed(0)} km`} /><Stat label="Eccentricity" value={ecc.toFixed(2)} /></div>}
    ><canvas ref={canvasRef} width={420} height={380} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
