"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function ExoplanetTransitStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ratio, setRatio] = useState(0.1); // Rp/Rs
  const [impact, setImpact] = useState(0.2); // impact parameter b (0..1)
  const [running, setRunning] = useState(true);
  const phase = useRef(0);
  const curve = useRef<number[]>([]);

  const depth = ratio * ratio;

  useEffect(() => {
    if (!running) return; let raf = 0;
    const W = 520, H = 360; const starX = W / 2, starY = 120, Rs = 70;
    const loop = () => {
      phase.current += 0.008; if (phase.current > 1) { phase.current = 0; curve.current = []; }
      const t = phase.current; const px = (t * 2 - 1) * (W * 0.55) + starX; const py = starY + impact * Rs;
      // brightness: overlap of planet disk over star disk
      const Rp = ratio * Rs; const d = Math.hypot(px - starX, py - starY);
      let flux = 1;
      if (d < Rs + Rp) { if (d <= Rs - Rp) flux = 1 - depth; else { // partial overlap area
        const r1 = Rs, r2 = Rp; const a = (d * d + r1 * r1 - r2 * r2) / (2 * d); const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
        const A1 = r1 * r1 * Math.acos(Math.min(1, Math.max(-1, a / r1))); const A2 = r2 * r2 * Math.acos(Math.min(1, Math.max(-1, (d - a) / r2)));
        const area = A1 + A2 - d * h; flux = 1 - (area / (Math.PI * Rs * Rs)); } }
      curve.current.push(flux); if (curve.current.length > 260) curve.current.shift();
      const ctx = canvasRef.current!.getContext("2d")!; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      // star
      const g = ctx.createRadialGradient(starX, starY, 10, starX, starY, Rs); g.addColorStop(0, "#fff7ed"); g.addColorStop(0.7, "#fbbf24"); g.addColorStop(1, "#f59e0b");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(starX, starY, Rs, 0, 7); ctx.fill();
      // planet
      ctx.fillStyle = "#0f172a"; ctx.beginPath(); ctx.arc(px, py, Rp, 0, 7); ctx.fill(); ctx.strokeStyle = "#334155"; ctx.stroke();
      // light curve
      ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(30, 250); ctx.lineTo(W - 10, 250); ctx.stroke();
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
      curve.current.forEach((f, i) => { const x = 30 + (i / 260) * (W - 40); const y = 250 + (1 - f) * 900; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("relative brightness vs time", 30, 275);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, ratio, impact]);

  return (
    <StudioChrome title="Exoplanet Transit" tagline="the transit method · light curves"
      controls={<div>
        <Slider label="Planet/star radius (Rp/Rs)" value={ratio} min={0.02} max={0.3} step={0.01} onChange={setRatio} />
        <Slider label="Impact parameter b" value={impact} min={0} max={1} step={0.05} onChange={setImpact} />
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">As a planet crosses its star, it blocks a tiny fraction of the light — a dip of depth (Rp/Rs)². This is how Kepler and TESS have found thousands of exoplanets. Impact parameter sets how centrally the planet crosses, changing the transit shape and duration.</p>
      </div>}
      inspector={<div><Stat label="Transit depth" value={`${(depth * 100).toFixed(2)}%`} /><Stat label="Rp/Rs" value={ratio.toFixed(2)} /><Stat label="Impact b" value={impact.toFixed(2)} /></div>}
    ><canvas ref={canvasRef} width={520} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
