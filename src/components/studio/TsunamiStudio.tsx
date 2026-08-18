"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Shallow-water wave: speed v = sqrt(g h); amplitude shoals as h^(-1/4) (Green's law).
const G = 9.81;

export function TsunamiStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [deepDepth, setDeepDepth] = useState(4000); // m
  const [deepAmp, setDeepAmp] = useState(0.5); // m
  const [running, setRunning] = useState(true);
  const pos = useRef(0);
  const [speed, setSpeed] = useState(0);
  const [shoreAmp, setShoreAmp] = useState(0);

  const W = 540, H = 320;
  const depthAt = (x: number) => { const f = x / W; return Math.max(10, deepDepth * (1 - f) + 10 * f); }; // shallows toward right

  useEffect(() => {
    if (!running) return; let raf = 0;
    const loop = () => {
      const h = depthAt(pos.current); const v = Math.sqrt(G * h); // m/s
      pos.current += v / 800 * (W / 60); if (pos.current > W) pos.current = 0;
      const amp = deepAmp * Math.pow(deepDepth / h, 0.25); // Green's law
      setSpeed(v); setShoreAmp(deepAmp * Math.pow(deepDepth / depthAt(W - 2), 0.25));
      const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      // seabed
      ctx.fillStyle = "#292524"; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 4) { const d = depthAt(x); const y = H - 30 - (1 - d / deepDepth) * (H - 90); ctx.lineTo(x, y); } ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      // ocean surface with wave pulse
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = 0; x <= W; x += 2) { const local = depthAt(x); const a = deepAmp * Math.pow(deepDepth / local, 0.25); const env = Math.exp(-((x - pos.current) ** 2) / 1200); const y = 60 - env * a * 18; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      ctx.fillStyle = "rgba(34,211,238,0.08)"; ctx.fillRect(0, 60, W, H - 90);
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("deep ocean", 10, 20); ctx.fillText("coast →", W - 60, 20); void amp;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, deepDepth, deepAmp]);

  return (
    <StudioChrome title="Tsunami Propagation" tagline="shallow-water waves · shoaling"
      controls={<div>
        <Slider label="Ocean depth (m)" value={deepDepth} min={500} max={7000} step={100} onChange={setDeepDepth} />
        <Slider label="Deep-water amplitude (m)" value={deepAmp} min={0.1} max={2} step={0.1} onChange={setDeepAmp} />
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">A tsunami is a shallow-water wave even in the deep ocean, travelling at √(g·h). Over 4 km of water that is roughly 700 km/h — jet speed — yet only tens of centimeters high. As it reaches shallow coast it slows and its amplitude grows as h^(−1/4) (Green&apos;s law), piling into a destructive wall.</p>
      </div>}
      inspector={<div><Stat label="Current speed" value={`${(speed * 3.6).toFixed(0)} km/h`} /><Stat label="Deep amplitude" value={`${deepAmp.toFixed(1)} m`} /><Stat label="Coastal amplitude" value={`${shoreAmp.toFixed(1)} m`} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
