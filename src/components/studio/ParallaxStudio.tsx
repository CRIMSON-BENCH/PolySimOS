"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function ParallaxStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [parallax, setParallax] = useState(0.1); // arcsec
  const [running, setRunning] = useState(true);
  const phase = useRef(0);

  const distPc = 1 / parallax; // parsecs
  const distLy = distPc * 3.26156;

  useEffect(() => {
    if (!running) return; let raf = 0;
    const loop = () => {
      phase.current += 0.02; const t = phase.current; const W = 520, H = 360;
      const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      // sun
      const sunX = 130, sunY = H / 2; ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(sunX, sunY, 12, 0, 7); ctx.fill();
      // Earth orbit
      ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.ellipse(sunX, sunY, 45, 30, 0, 0, 7); ctx.stroke();
      const ex = sunX + Math.cos(t) * 45, ey = sunY + Math.sin(t) * 30; ctx.fillStyle = "#60a5fa"; ctx.beginPath(); ctx.arc(ex, ey, 5, 0, 7); ctx.fill();
      // nearby star
      const starX = 340, starY = H / 2; const shift = Math.cos(t) * Math.min(60, parallax * 400);
      ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(starX, starY, 6, 0, 7); ctx.fill();
      // background stars (fixed)
      ctx.fillStyle = "#64748b"; for (let i = 0; i < 30; i++) { const bx = 440 + (i % 6) * 12, by = 40 + ((i / 6) | 0) * 60; ctx.beginPath(); ctx.arc(bx, by, 1.5, 0, 7); ctx.fill(); }
      // sightline from Earth through star to background (apparent shift)
      ctx.strokeStyle = "rgba(244,114,182,0.4)"; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(490, starY + shift); ctx.stroke();
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("Sun", sunX - 10, sunY + 26); ctx.fillText("nearby star", starX - 24, starY - 14); ctx.fillText("distant background", 420, 24);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, parallax]);

  return (
    <StudioChrome title="Stellar Parallax" tagline="the first rung of the distance ladder"
      controls={<div>
        <Slider label="Parallax angle (arcsec)" value={parallax} min={0.005} max={0.8} step={0.005} onChange={setParallax} />
        <div className="mt-3 flex flex-wrap gap-1">{[["Proxima", 0.7687], ["Sirius", 0.379], ["Vega", 0.130], ["Betelgeuse", 0.0055]].map(([n, p]) => <button key={n} onClick={() => setParallax(p as number)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-400">{n}</button>)}</div>
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">As Earth orbits the Sun, a nearby star appears to shift against the distant background. Half that annual shift is the parallax angle p, and distance in parsecs is simply 1/p (with p in arcseconds). One parsec is the distance giving a one-arcsecond parallax.</p>
      </div>}
      inspector={<div><Stat label="Distance" value={`${distPc.toFixed(1)} pc`} /><Stat label="Light years" value={`${distLy.toFixed(1)} ly`} /><Stat label="Parallax" value={`${parallax.toFixed(3)}″`} /></div>}
    ><canvas ref={canvasRef} width={520} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
