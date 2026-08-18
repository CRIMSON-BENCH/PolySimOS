"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Three-phase power: waveforms, phasors, power.
export function ThreePhaseStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [vLine, setVLine] = useState(400); // V line-to-line
  const [current, setCurrent] = useState(20); // A
  const [pf, setPf] = useState(0.9); // power factor
  const [running, setRunning] = useState(true);
  const phase = useRef(0);

  const vPhase = vLine / Math.sqrt(3);
  const P = Math.sqrt(3) * vLine * current * pf / 1000; // kW
  const S = Math.sqrt(3) * vLine * current / 1000; // kVA
  const Q = Math.sqrt(Math.max(0, S * S - P * P)); // kVAR
  const phi = Math.acos(pf);

  useEffect(() => {
    if (!running) return; let raf = 0;
    const cols = ["#f472b6", "#a3e635", "#22d3ee"];
    const loop = () => {
      phase.current += 0.04; const t = phase.current; const W = 540, H = 320;
      const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      // waveforms (left)
      const ox = 20, mid = H / 2, wv = 300;
      ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, mid); ctx.lineTo(ox + wv, mid); ctx.stroke();
      for (let p = 0; p < 3; p++) { ctx.strokeStyle = cols[p]; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i <= wv; i++) { const x = (i / wv) * 4 * Math.PI; const v = Math.sin(x - t - p * 2 * Math.PI / 3); const y = mid - v * 70; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke(); }
      // phasors (right)
      const px = 420, py = mid, R = 70;
      ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.arc(px, py, R, 0, 7); ctx.stroke();
      for (let p = 0; p < 3; p++) { const ang = -t - p * 2 * Math.PI / 3; ctx.strokeStyle = cols[p]; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(ang) * R, py + Math.sin(ang) * R); ctx.stroke(); }
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("three-phase voltages (120° apart)", ox, 18); ctx.fillText("phasors", px - 20, py + R + 20);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running]);

  return (
    <StudioChrome title="Three-Phase Power" tagline="the grid's backbone"
      controls={<div>
        <Slider label="Line voltage (V)" value={vLine} min={120} max={690} step={10} onChange={setVLine} />
        <Slider label="Line current (A)" value={current} min={1} max={200} step={1} onChange={setCurrent} />
        <Slider label="Power factor" value={pf} min={0.5} max={1} step={0.01} onChange={setPf} />
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">Three-phase power delivers energy on three conductors carrying sinusoids 120° apart, so total power is constant and motors self-start. Line and phase voltages differ by √3, and real power is P = √3·V_line·I·cosφ. The power factor cosφ measures how much current actually does useful work.</p>
      </div>}
      inspector={<div><Stat label="Phase voltage" value={`${vPhase.toFixed(0)} V`} /><Stat label="Real power P" value={`${P.toFixed(1)} kW`} /><Stat label="Apparent S" value={`${S.toFixed(1)} kVA`} /><Stat label="Reactive Q" value={`${Q.toFixed(1)} kVAR`} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
