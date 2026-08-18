"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function GlideStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ld, setLd] = useState(15);
  const [altitude, setAltitude] = useState(1000); // m
  const [speed, setSpeed] = useState(30); // m/s

  const glideAngle = Math.atan(1 / ld) * 180 / Math.PI; const range = altitude * ld; const sinkRate = speed / ld;
  const time = range / speed;

  useEffect(() => {
    const W = 520, H = 260; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 30, oy = 40; const gx = W - 40, gy = oy + Math.min(H - 80, (gx - ox) / ld);
    // ground
    ctx.fillStyle = "#1e293b"; ctx.fillRect(0, H - 30, W, 30);
    // glide path
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(gx, gy); ctx.stroke();
    // aircraft
    ctx.fillStyle = "#f472b6"; ctx.save(); ctx.translate(ox, oy); ctx.rotate(Math.atan2(gy - oy, gx - ox)); ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -5); ctx.lineTo(-8, 5); ctx.fill(); ctx.restore();
    ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(gx, oy); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`glide angle ${glideAngle.toFixed(1)}°`, ox + 30, oy + 18); ctx.fillText(`range ${(range / 1000).toFixed(1)} km from ${altitude} m`, ox + 30, H - 40);
  }, [ld, altitude, speed]);

  return (
    <StudioChrome title="Glide Performance" tagline="how far from how high"
      controls={<div>
        <Slider label="Glide ratio (L/D)" value={ld} min={4} max={60} step={1} onChange={setLd} />
        <Slider label="Altitude (m)" value={altitude} min={100} max={5000} step={100} onChange={setAltitude} />
        <Slider label="Airspeed (m/s)" value={speed} min={10} max={80} step={2} onChange={setSpeed} />
        <p className="mt-3 text-xs text-slate-500">An unpowered aircraft trades height for distance. Its glide ratio, L/D, is exactly how many meters forward it travels per meter of descent — a modern glider does 50:1. The shallow glide angle is set only by L/D, not weight, while the sink rate and time aloft depend on speed. Vital knowledge after an engine failure.</p>
      </div>}
      inspector={<div><Stat label="Glide range" value={`${(range / 1000).toFixed(1)} km`} /><Stat label="Glide angle" value={`${glideAngle.toFixed(1)}°`} /><Stat label="Sink rate" value={`${sinkRate.toFixed(1)} m/s`} /><Stat label="Time aloft" value={`${(time / 60).toFixed(1)} min`} /></div>}
    ><canvas ref={canvasRef} width={520} height={260} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
