"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { Z0: number; RL: number; XL: number }> = {
  "Perfect match": { Z0: 50, RL: 50, XL: 0 },
  "75Ω load": { Z0: 50, RL: 75, XL: 0 },
  "Open-ish (300Ω)": { Z0: 50, RL: 300, XL: 0 },
  "Reactive load": { Z0: 50, RL: 40, XL: 80 },
};

// Transmission line: reflection, VSWR, standing wave.
export function TransmissionLineStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ Z0, RL, XL }, update] = useShareableNumbers({ Z0: 50, RL: 75, XL: 0 });
  const [running, setRunning] = useState(true);
  const phase = useRef(0);

  // reflection coefficient
  const num_re = RL - Z0, num_im = XL; const den_re = RL + Z0, den_im = XL;
  const gMag = Math.hypot(num_re, num_im) / Math.hypot(den_re, den_im);
  const gPhase = Math.atan2(num_im, num_re) - Math.atan2(den_im, den_re);
  const VSWR = (1 + gMag) / (1 - gMag);
  const returnLoss = -20 * Math.log10(gMag || 1e-6);

  useEffect(() => {
    if (!running) return; let raf = 0;
    const loop = () => {
      phase.current += 0.05; const t = phase.current; const W = 540, H = 300;
      const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const ox = 30, mid = H / 2, len = W - 60;
      // incident + reflected -> standing wave envelope
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= len; i++) { const x = i / len; const beta = 2 * Math.PI * 3; // 3 wavelengths
        const inc = Math.sin(beta * x - t); const refl = gMag * Math.sin(beta * x + t + gPhase);
        const v = inc + refl; const y = mid - v * 50; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
      // envelope
      ctx.strokeStyle = "rgba(244,114,182,0.6)"; ctx.setLineDash([4, 3]);
      for (const sgn of [1, -1]) { ctx.beginPath(); for (let i = 0; i <= len; i++) { const x = i / len; const beta = 2 * Math.PI * 3; const env = Math.sqrt(1 + gMag * gMag + 2 * gMag * Math.cos(2 * beta * x + gPhase)); const y = mid - sgn * env * 50; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke(); } ctx.setLineDash([]);
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("source", ox, mid + 70); ctx.fillText("load", ox + len - 26, mid + 70); ctx.fillStyle = "#f9a8d4"; ctx.fillText("standing-wave envelope", ox + 6, 20);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, Z0, RL, XL, gMag, gPhase]);

  const explain =
    gMag < 0.05
      ? "Load and line are essentially matched (VSWR near 1) — virtually all power reaches the load and the standing wave is nearly flat."
      : gMag < 0.2
      ? "A modest mismatch: most power is delivered, but a small reflected wave creates gentle ripples in the standing-wave envelope."
      : XL !== 0
      ? "The reactive load pushes the reflection coefficient off the real axis — a large standing wave forms and the match stays poor until the reactance is tuned out."
      : "A large resistive mismatch reflects much of the wave, giving a high VSWR and deep nulls in the standing-wave pattern.";

  const code = `import numpy as np
Z0, RL, XL = ${Z0}, ${RL}, ${XL}
gamma = (RL + 1j*XL - Z0) / (RL + 1j*XL + Z0)
mag = abs(gamma)
vswr = (1 + mag) / (1 - mag)
print("|Gamma|", round(mag, 3), " VSWR", round(vswr, 2))`;

  return (
    <StudioChrome title="Transmission Line & VSWR" tagline="impedance matching · reflections"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Line impedance Z₀ (Ω)" value={Z0} min={25} max={150} step={5} onChange={(v) => update({ Z0: v })} />
        <Slider label="Load resistance RL (Ω)" value={RL} min={0} max={300} step={5} onChange={(v) => update({ RL: v })} />
        <Slider label="Load reactance XL (Ω)" value={XL} min={-150} max={150} step={5} onChange={(v) => update({ XL: v })} />
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">When a transmission line meets a load that does not match its impedance, part of the wave reflects. Incident and reflected waves combine into a standing-wave pattern measured by the VSWR. A perfect match (RL = Z₀, XL = 0) gives VSWR 1 and no reflection — the goal of every antenna and RF design.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Reflection |Γ|" value={gMag.toFixed(3)} /><Stat label="VSWR" value={VSWR > 99 ? "∞" : `${VSWR.toFixed(2)} : 1`} /><Stat label="Return loss" value={`${returnLoss.toFixed(1)} dB`} /><Stat label="Match" value={gMag < 0.05 ? "excellent" : gMag < 0.2 ? "good" : "poor"} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
