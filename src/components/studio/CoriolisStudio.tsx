"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { latitude: number }> = {
  "Equator (0°)": { latitude: 0 },
  "Tropics (23°)": { latitude: 23 },
  "Mid-latitude (45°)": { latitude: 45 },
  "Near pole (80°)": { latitude: 80 },
};

// Coriolis deflection on a rotating planet (rotating-frame view).
export function CoriolisStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ latitude }, update] = useShareableNumbers({ latitude: 45 });
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

  const strengthPct = Math.sin(latitude * Math.PI / 180) * 100;
  const explain =
    latitude === 0
      ? "At the equator the Coriolis force vanishes — a freely moving object travels dead straight, which is why hurricanes never form right on the equator."
      : `Deflection scales with sin(latitude), so at ${latitude}° the force is about ${strengthPct.toFixed(0)}% of its polar maximum, curving motion to the ${hemisphere === 1 ? "right (Northern Hemisphere)" : "left (Southern Hemisphere)"}.`;

  const code = `import numpy as np
latitude, hemisphere = ${latitude}, ${hemisphere}
f = 2 * 0.02 * np.sin(np.radians(latitude)) * hemisphere
x, y, vx, vy = 270.0, 340.0, 0.0, -3.0
path = [(x, y)]
for _ in range(400):
    ax, ay = f * vy, -f * vx
    vx += ax; vy += ay
    x += vx; y += vy
    path.append((x, y))
print("final position", x, y)`;

  return (
    <StudioChrome title="Coriolis Effect" tagline="why winds and currents curve"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Latitude (°)" value={latitude} min={0} max={90} step={1} onChange={(v) => update({ latitude: v })} />
        <div className="mt-3 flex gap-2"><button onClick={() => setHemisphere(1)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold ${hemisphere === 1 ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>Northern</button><button onClick={() => setHemisphere(-1)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold ${hemisphere === -1 ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>Southern</button></div>
        <button onClick={() => setRunning((r) => !r)} className="mt-2 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">On a spinning planet, anything moving freely appears to curve — right in the Northern Hemisphere, left in the Southern. This Coriolis deflection is zero at the equator and strongest at the poles. It steers winds, ocean currents, and the rotation of hurricanes, and it is why weather systems spin.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Latitude" value={`${latitude}°`} />
        <Stat label="Deflection" value={hemisphere === 1 ? "to the right" : "to the left"} />
        <Stat label="Strength" value={latitude === 0 ? "zero (equator)" : `${strengthPct.toFixed(0)}%`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={540} height={380} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
