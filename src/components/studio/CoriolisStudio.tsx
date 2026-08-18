"use client";

import { useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
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
  const [hemisphere, setHemisphere] = useState(1); // 1 = N, -1 = S
  const latRef = useRef(latitude); latRef.current = latitude;
  const hemiRef = useRef(hemisphere); hemiRef.current = hemisphere;
  const sim = useRef<{ x: number; y: number; vx: number; vy: number; trail: [number, number][] }>({ x: 270, y: 340, vx: 0, vy: -3, trail: [] });

  const reset = () => { sim.current = { x: 270, y: 340, vx: 0, vy: -3, trail: [] }; };

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = hidpi(canvas, 540, 380);
    const f = 2 * 0.02 * Math.sin(latRef.current * Math.PI / 180) * hemiRef.current; // Coriolis param scaled
    const st = sim.current;
    for (let k = 0; k < 2 * steps; k++) { const ax = f * st.vy, ay = -f * st.vx; st.vx += ax; st.vy += ay; st.x += st.vx; st.y += st.vy; if (st.x < 10 || st.x > 530 || st.y < 10 || st.y > 370) { st.x = 270; st.y = 340; st.vx = 0; st.vy = -3; st.trail.length = 0; } st.trail.push([st.x, st.y]); if (st.trail.length > 400) st.trail.shift(); }
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 540, 380);
    ctx.strokeStyle = "#334155"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(270, 340); ctx.lineTo(270, 10); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); st.trail.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(st.x, st.y, 5, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("intended path (dashed) vs actual (curved)", 12, 20);
  };

  const t = useTransport(frame);

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
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { reset(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Latitude (°)" value={latitude} min={0} max={90} step={1} onChange={(v) => update({ latitude: v })} />
        <div className="mt-3 flex gap-2"><button onClick={() => setHemisphere(1)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold ${hemisphere === 1 ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>Northern</button><button onClick={() => setHemisphere(-1)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold ${hemisphere === -1 ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>Southern</button></div>
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
