"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Rankine vortex: tornado wind profile (solid-body core + 1/r outside).
export function RankineVortexStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coreR, setCoreR] = useState(50); // m
  const [maxWind, setMaxWind] = useState(70); // m/s
  const [running, setRunning] = useState(true);
  const rot = useRef(0);

  const windAt = (r: number) => r <= coreR ? maxWind * (r / coreR) : maxWind * (coreR / r);
  const ef = maxWind * 2.237; // mph
  const efScale = ef < 86 ? "EF0" : ef < 111 ? "EF1" : ef < 136 ? "EF2" : ef < 166 ? "EF3" : ef < 201 ? "EF4" : "EF5";

  useEffect(() => {
    if (!running) return; let raf = 0;
    const loop = () => {
      rot.current += 0.05; const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 300; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      // wind profile plot (left)
      const ox = 40, oy = H - 30, pw = 200, ph = H - 60; const rMax = coreR * 4;
      ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let r = 0; r <= rMax; r += rMax / 100) { const x = ox + (r / rMax) * pw; const y = oy - (windAt(r) / (maxWind * 1.1)) * ph; r === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
      ctx.strokeStyle = "#475569"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(ox + (coreR / rMax) * pw, oy); ctx.lineTo(ox + (coreR / rMax) * pw, oy - ph); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText("wind vs radius", ox + 4, oy - ph + 12); ctx.fillText("core", ox + (coreR / rMax) * pw - 10, oy + 14);
      // vortex (right)
      const cx = 380, cy = H / 2; for (let ring = 1; ring <= 6; ring++) { const r = ring * 18; const w = windAt(r * 2); ctx.strokeStyle = `rgba(148,163,184,${0.6 * w / maxWind})`; ctx.lineWidth = 2; ctx.beginPath(); for (let a = 0; a < 6.3; a += 0.2) { const speed = windAt(r * 2) / maxWind; const aa = a + rot.current * speed * 2; const x = cx + Math.cos(aa) * r, y = cy + Math.sin(aa) * r * 0.9; a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [coreR, maxWind, running]);

  return (
    <StudioChrome title="Tornado Vortex (Rankine)" tagline="wind speed vs radius"
      controls={<div>
        <Slider label="Core radius (m)" value={coreR} min={10} max={150} step={5} onChange={setCoreR} />
        <Slider label="Max wind (m/s)" value={maxWind} min={20} max={140} step={5} onChange={setMaxWind} />
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">A tornado&apos;s winds follow the Rankine vortex model: inside the core the air spins like a solid disk, with speed rising straight out to a peak at the core edge; outside, the wind falls off as 1/r. The fastest, most destructive winds ring the core, not the very center — which is why the eye of a vortex is deceptively calm.</p>
      </div>}
      inspector={<div><Stat label="Peak wind" value={`${maxWind} m/s`} /><Stat label="Peak (mph)" value={`${ef.toFixed(0)} mph`} /><Stat label="EF rating" value={efScale} /><Stat label="Peak at" value={`r = ${coreR} m`} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
