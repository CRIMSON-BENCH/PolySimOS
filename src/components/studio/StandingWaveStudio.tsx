"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 760, H = 420;

export function StandingWaveStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const [mode, setMode] = useState(3);
  const [running, setRunning] = useState(true);
  const t = useRef(0);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    const loop = () => {
      if (running) t.current += 0.05;
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const pad = 40, mid = H / 2, amp = H * 0.32;
      ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(pad, mid); ctx.lineTo(W - pad, mid); ctx.stroke();
      // envelope
      ctx.strokeStyle = "rgba(148,163,184,0.3)"; ctx.setLineDash([4, 4]);
      for (const s of [1, -1]) { ctx.beginPath(); for (let px = pad; px <= W - pad; px++) { const x = (px - pad) / (W - 2 * pad); const env = s * amp * Math.sin(mode * Math.PI * x); px === pad ? ctx.moveTo(px, mid - env) : ctx.lineTo(px, mid - env); } ctx.stroke(); } ctx.setLineDash([]);
      // wave
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let px = pad; px <= W - pad; px++) { const x = (px - pad) / (W - 2 * pad); const y = amp * Math.sin(mode * Math.PI * x) * Math.cos(t.current); px === pad ? ctx.moveTo(px, mid - y) : ctx.lineTo(px, mid - y); } ctx.stroke();
      // nodes
      for (let k = 0; k <= mode; k++) { const px = pad + (k / mode) * (W - 2 * pad); ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(px, mid, 4, 0, 7); ctx.fill(); }
      ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`harmonic n = ${mode} · ${mode + 1} nodes · ${mode} antinodes`, pad, 26);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [mode, running]);

  return (
    <StudioChrome title="Standing Waves on a String" tagline="harmonics · nodes & antinodes"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button></div>
        <p className="mb-3 text-xs text-slate-500">A string fixed at both ends can only vibrate at its harmonics. Each mode n has n+1 nodes (pink) that stay still while the antinodes swing — the physics of every stringed instrument.</p>
        <Slider label="Harmonic n" value={mode} min={1} max={9} step={1} onChange={setMode} />
      </div>}
      inspector={<div><Stat label="Harmonic" value={`n = ${mode}`} /><Stat label="Nodes" value={String(mode + 1)} /><Stat label="Antinodes" value={String(mode)} /><Stat label="Wavelength" value={`2L/${mode}`} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
