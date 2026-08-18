"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { ld: number; altitude: number; speed: number }> = {
  "Modern sailplane": { ld: 50, altitude: 2000, speed: 30 },
  "Airliner engine-out": { ld: 17, altitude: 3000, speed: 70 },
  "Cessna glide": { ld: 9, altitude: 1000, speed: 30 },
  "Hang glider": { ld: 12, altitude: 500, speed: 14 },
};

export function GlideStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ ld, altitude, speed }, update] = useShareableNumbers({ ld: 15, altitude: 1000, speed: 30 });

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

  const explain =
    ld >= 40
      ? "A high L/D like this lets the aircraft cover a huge distance for its height — the shallow glide angle, not the weight, is what sets that reach."
      : ld <= 10
      ? "With a low glide ratio the descent is steep: little forward distance per meter dropped, so an engine-out leaves few reachable landing options."
      : "Glide angle depends only on L/D, so the range scales straight with altitude; speed changes how fast you sink and how long you stay up, but not how far you reach.";

  const code = `import numpy as np
ld, altitude, speed = ${ld}, ${altitude}, ${speed}  # ratio, m, m/s
glide_angle = np.degrees(np.arctan(1/ld))
range_km = altitude*ld/1000
sink = speed/ld
print("range", round(range_km, 1), "km; angle", round(glide_angle, 1), "deg")`;

  return (
    <StudioChrome title="Glide Performance" tagline="how far from how high"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Glide ratio (L/D)" value={ld} min={4} max={60} step={1} onChange={(v) => update({ ld: v })} />
        <Slider label="Altitude (m)" value={altitude} min={100} max={5000} step={100} onChange={(v) => update({ altitude: v })} />
        <Slider label="Airspeed (m/s)" value={speed} min={10} max={80} step={2} onChange={(v) => update({ speed: v })} />
        <p className="mt-3 text-xs text-slate-500">An unpowered aircraft trades height for distance. Its glide ratio, L/D, is exactly how many meters forward it travels per meter of descent — a modern glider does 50:1. The shallow glide angle is set only by L/D, not weight, while the sink rate and time aloft depend on speed. Vital knowledge after an engine failure.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Glide range" value={`${(range / 1000).toFixed(1)} km`} /><Stat label="Glide angle" value={`${glideAngle.toFixed(1)}°`} /><Stat label="Sink rate" value={`${sinkRate.toFixed(1)} m/s`} /><Stat label="Time aloft" value={`${(time / 60).toFixed(1)} min`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={260} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
