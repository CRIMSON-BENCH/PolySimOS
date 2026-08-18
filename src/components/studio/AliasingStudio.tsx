"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Sampling & aliasing: Nyquist demonstration.
export function AliasingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signalF, setSignalF] = useState(3); // Hz
  const [sampleF, setSampleF] = useState(20); // Hz

  const nyquist = sampleF / 2;
  const aliased = signalF > nyquist;
  // apparent (alias) frequency
  let apparent = signalF; if (aliased) { apparent = Math.abs(signalF - sampleF * Math.round(signalF / sampleF)); }

  useEffect(() => {
    const W = 540, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 20, mid = H / 2, pw = W - 40, dur = 1; // 1 second window
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, mid); ctx.lineTo(ox + pw, mid); ctx.stroke();
    // true signal
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const t = (i / pw) * dur; const v = Math.sin(2 * Math.PI * signalF * t); const y = mid - v * 90; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    // samples
    const nSamp = Math.floor(sampleF * dur); const pts: [number, number][] = [];
    for (let k = 0; k <= nSamp; k++) { const t = k / sampleF; const v = Math.sin(2 * Math.PI * signalF * t); const x = ox + (t / dur) * pw; const y = mid - v * 90; pts.push([x, y]); ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill(); }
    // reconstructed (alias) — connect samples
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("true signal (gray) · samples (pink) · reconstructed (cyan)", ox, H - 12);
  }, [signalF, sampleF]);

  return (
    <StudioChrome title="Sampling & Aliasing" tagline="the Nyquist theorem"
      controls={<div>
        <Slider label="Signal frequency (Hz)" value={signalF} min={1} max={30} step={0.5} onChange={setSignalF} />
        <Slider label="Sample rate (Hz)" value={sampleF} min={4} max={60} step={1} onChange={setSampleF} />
        <p className="mt-3 text-xs text-slate-500">To capture a signal faithfully you must sample above twice its highest frequency — the Nyquist rate. Sample too slowly and a high frequency masquerades as a lower one: aliasing. Push the signal frequency above half the sample rate and watch the reconstructed wave collapse to a false, slower tone.</p>
      </div>}
      inspector={<div><Stat label="Nyquist frequency" value={`${nyquist.toFixed(1)} Hz`} /><Stat label="Status" value={aliased ? "ALIASED" : "properly sampled"} /><Stat label="Apparent frequency" value={`${apparent.toFixed(1)} Hz`} /></div>}
    ><canvas ref={canvasRef} width={540} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
