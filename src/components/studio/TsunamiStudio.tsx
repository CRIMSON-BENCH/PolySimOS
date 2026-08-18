"use client";

import { useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

// Shallow-water wave: speed v = sqrt(g h); amplitude shoals as h^(-1/4) (Green's law).
const G = 9.81;

const PRESETS: Record<string, { deepDepth: number; deepAmp: number }> = {
  "Deep Pacific": { deepDepth: 6000, deepAmp: 0.5 },
  "Shallow shelf": { deepDepth: 1000, deepAmp: 0.8 },
  "Large source": { deepDepth: 4000, deepAmp: 1.8 },
  "Small ripple": { deepDepth: 3000, deepAmp: 0.2 },
};

export function TsunamiStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ deepDepth, deepAmp }, update] = useShareableNumbers({ deepDepth: 4000, deepAmp: 0.5 });
  const deepDepthRef = useRef(deepDepth); deepDepthRef.current = deepDepth;
  const deepAmpRef = useRef(deepAmp); deepAmpRef.current = deepAmp;
  const pos = useRef(0);
  const [speed, setSpeed] = useState(0);
  const [shoreAmp, setShoreAmp] = useState(0);

  const W = 540, H = 320;

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const deepDepth = deepDepthRef.current, deepAmp = deepAmpRef.current;
    const depthAt = (x: number) => { const f = x / W; return Math.max(10, deepDepth * (1 - f) + 10 * f); }; // shallows toward right
    const h = depthAt(pos.current); const v = Math.sqrt(G * h); // m/s
    pos.current += v / 800 * (W / 60) * steps; if (pos.current > W) pos.current = 0;
    const amp = deepAmp * Math.pow(deepDepth / h, 0.25); // Green's law
    setSpeed(v); setShoreAmp(deepAmp * Math.pow(deepDepth / depthAt(W - 2), 0.25));
    const ctx = hidpi(canvas, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // seabed
    ctx.fillStyle = "#292524"; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 4) { const d = depthAt(x); const y = H - 30 - (1 - d / deepDepth) * (H - 90); ctx.lineTo(x, y); } ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    // ocean surface with wave pulse
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 0; x <= W; x += 2) { const local = depthAt(x); const a = deepAmp * Math.pow(deepDepth / local, 0.25); const env = Math.exp(-((x - pos.current) ** 2) / 1200); const y = 60 - env * a * 18; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ctx.fillStyle = "rgba(34,211,238,0.08)"; ctx.fillRect(0, 60, W, H - 90);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("deep ocean", 10, 20); ctx.fillText("coast →", W - 60, 20); void amp;
  };

  const t = useTransport(frame);

  const deepV = Math.sqrt(G * deepDepth) * 3.6; // km/h
  const explain =
    deepDepth > 5000
      ? `In ${deepDepth} m of open ocean the wave races at ~${deepV.toFixed(0)} km/h — jetliner speed — yet stays barely a metre tall until it reaches the coast.`
      : deepDepth < 1500
      ? `Over a shallow ${deepDepth} m shelf the wave travels slower but shoals sooner, so its ${deepAmp.toFixed(1)} m deep-water height builds into a coastal wall earlier along the approach.`
      : `At ${deepDepth} m depth the pulse moves at ~${deepV.toFixed(0)} km/h; Green law shoaling then amplifies its ${deepAmp.toFixed(1)} m deep-water height as it nears the coast.`;

  const code = `import numpy as np
g, deep_depth, deep_amp = 9.81, ${deepDepth}, ${deepAmp}
def depth_at(f): return max(10.0, deep_depth*(1-f) + 10*f)  # f in [0,1] toward coast
for f in np.linspace(0, 1, 6):
    h = depth_at(f)
    v = np.sqrt(g*h)                       # shallow-water wave speed (m/s)
    amp = deep_amp*(deep_depth/h)**0.25    # Green's law shoaling
    print(f"{h:7.0f} m  {v*3.6:6.0f} km/h  {amp:.2f} m")`;

  return (
    <StudioChrome title="Tsunami Propagation" tagline="shallow-water waves · shoaling"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} speed={t.speed} onSpeed={t.setSpeed} />
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Ocean depth (m)" value={deepDepth} min={500} max={7000} step={100} onChange={(v) => update({ deepDepth: v })} />
        <Slider label="Deep-water amplitude (m)" value={deepAmp} min={0.1} max={2} step={0.1} onChange={(v) => update({ deepAmp: v })} />
        <p className="mt-3 text-xs text-slate-500">A tsunami is a shallow-water wave even in the deep ocean, travelling at √(g·h). Over 4 km of water that is roughly 700 km/h — jet speed — yet only tens of centimeters high. As it reaches shallow coast it slows and its amplitude grows as h^(−1/4) (Green&apos;s law), piling into a destructive wall.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Current speed" value={`${(speed * 3.6).toFixed(0)} km/h`} />
        <Stat label="Deep amplitude" value={`${deepAmp.toFixed(1)} m`} />
        <Stat label="Coastal amplitude" value={`${shoreAmp.toFixed(1)} m`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
