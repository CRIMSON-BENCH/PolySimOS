"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { fn: number; zeta: number }> = {
  "Underdamped (ζ=0.2)": { fn: 1000, zeta: 0.2 },
  "Butterworth (ζ=0.7)": { fn: 1000, zeta: 0.7 },
  "Critically damped": { fn: 1000, zeta: 1 },
  "Audio 20 kHz": { fn: 20000, zeta: 0.5 },
};

// Bode plot of a 2nd-order low-pass: H(s) = wn^2 / (s^2 + 2*zeta*wn*s + wn^2)
export function BodePlotStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ fn, zeta }, update] = useShareableNumbers({ fn: 1000, zeta: 0.3 });

  const wn = 2 * Math.PI * fn;
  const response = (f: number) => { const w = 2 * Math.PI * f; const re = wn * wn - w * w; const im = 2 * zeta * wn * w; const mag = wn * wn / Math.hypot(re, im); const ph = -Math.atan2(im, re) * 180 / Math.PI; return { magDb: 20 * Math.log10(mag), ph }; };
  const peak = zeta < 0.707 ? 20 * Math.log10(1 / (2 * zeta * Math.sqrt(1 - zeta * zeta))) : 0;

  useEffect(() => {
    const W = 540, H = 360; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, fMin = 1, fMax = 1e6; const logMin = Math.log10(fMin), logMax = Math.log10(fMax);
    const X = (f: number) => ox + (Math.log10(f) - logMin) / (logMax - logMin) * (W - 60);
    // magnitude plot (top)
    const my0 = 30, mh = 130; ctx.strokeStyle = "#334155"; ctx.strokeRect(ox, my0, W - 60, mh);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 300; i++) { const f = Math.pow(10, logMin + (i / 300) * (logMax - logMin)); const db = response(f).magDb; const y = my0 + mh / 2 - (db / 80) * mh; i ? ctx.lineTo(X(f), y) : ctx.moveTo(X(f), y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("magnitude (dB)", ox + 6, my0 + 14);
    // phase plot (bottom)
    const py0 = 200, ph = 130; ctx.strokeStyle = "#334155"; ctx.strokeRect(ox, py0, W - 60, ph);
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 300; i++) { const f = Math.pow(10, logMin + (i / 300) * (logMax - logMin)); const p = response(f).ph; const y = py0 + (-p / 180) * ph; i ? ctx.lineTo(X(f), y) : ctx.moveTo(X(f), y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.fillText("phase (deg)", ox + 6, py0 + 14);
    // fn marker
    ctx.strokeStyle = "#a3e635"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(X(fn), my0); ctx.lineTo(X(fn), py0 + ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#bef264"; ctx.fillText("fn", X(fn) + 3, py0 + ph + 12);
  }, [fn, zeta]);

  const explain =
    zeta < 0.5
      ? `Low damping ζ=${zeta.toFixed(2)} produces a sharp +${Math.max(peak, 0).toFixed(1)} dB resonant peak just below fn — great for selectivity, but it rings in the time domain.`
      : zeta < 0.68
      ? `Damping ζ=${zeta.toFixed(2)} leaves a small resonant bump before the −40 dB/decade roll-off begins.`
      : zeta <= 0.75
      ? "Near ζ=0.707 (Butterworth): the flattest possible passband with no resonant peak — the standard well-behaved filter choice."
      : `Heavy damping ζ=${zeta.toFixed(2)} is overdamped: no peak, a gentle rounded knee, and the two real poles roll off separately.`;

  const code = `import numpy as np
fn, zeta = ${fn}, ${zeta}
wn = 2 * np.pi * fn
f = np.logspace(0, 6, 300); w = 2 * np.pi * f
mag = wn**2 / np.hypot(wn**2 - w**2, 2 * zeta * wn * w)
mag_db = 20 * np.log10(mag)
peak = 20 * np.log10(1 / (2 * zeta * np.sqrt(1 - zeta**2))) if zeta < 0.707 else 0
print("resonant peak dB", peak)`;

  return (
    <StudioChrome title="Bode Plot (2nd-Order System)" tagline="frequency response"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Natural frequency (Hz)" value={fn} min={50} max={100000} step={50} onChange={(v) => update({ fn: v })} />
        <Slider label="Damping ratio ζ" value={zeta} min={0.05} max={2} step={0.05} onChange={(v) => update({ zeta: v })} />
        <p className="mt-3 text-xs text-slate-500">A Bode plot shows how a system responds across frequency: gain in decibels on top, phase shift below. This second-order low-pass passes low frequencies and rolls off at −40 dB/decade above its natural frequency. Low damping produces a resonant peak; high damping smooths it away.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Natural freq" value={`${fn.toLocaleString()} Hz`} />
        <Stat label="Damping ζ" value={zeta.toFixed(2)} />
        <Stat label="Resonant peak" value={peak > 0.01 ? `+${peak.toFixed(1)} dB` : "none"} />
        <Stat label="Roll-off" value="−40 dB/dec" />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={540} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
