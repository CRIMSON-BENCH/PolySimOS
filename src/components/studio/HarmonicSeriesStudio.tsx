"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const INTERVAL = ["", "unison", "octave", "fifth", "octave", "major 3rd", "fifth", "min 7th", "octave"];

const PRESETS: Record<string, { f0: number; nHarm: number; rolloff: number }> = {
  "Pure fundamental": { f0: 220, nHarm: 1, rolloff: 2.5 },
  "Few overtones": { f0: 110, nHarm: 3, rolloff: 1.5 },
  "Bright (many harmonics)": { f0: 110, nHarm: 12, rolloff: 0.6 },
  "Sawtooth-like": { f0: 110, nHarm: 12, rolloff: 1 },
};

export function HarmonicSeriesStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ f0, nHarm, rolloff }, update] = useShareableNumbers({ f0: 110, nHarm: 8, rolloff: 1 });

  useEffect(() => {
    const W = 540, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const N = Math.round(nHarm); const amps = Array.from({ length: N + 1 }, (_, k) => k === 0 ? 0 : 1 / Math.pow(k, rolloff));
    // spectrum (top)
    const ox = 40, topY = 150, sw = W - 80;
    for (let k = 1; k <= N; k++) { const x = ox + (k / (N + 1)) * sw; const h = amps[k] * 100; ctx.fillStyle = "#22d3ee"; ctx.fillRect(x - 6, topY - h, 12, h); ctx.fillStyle = "#94a3b8"; ctx.font = "9px sans-serif"; ctx.fillText(`${k}`, x - 3, topY + 12); ctx.fillText(`${(f0 * k).toFixed(0)}`, x - 12, topY + 24); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("harmonics (Hz)", ox, 20);
    // waveform (bottom)
    const midY = 270, wh = 60; ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath();
    let norm = 0; for (let i = 0; i < sw; i++) { let v = 0; for (let k = 1; k <= N; k++) v += amps[k] * Math.sin(2 * Math.PI * k * i / sw * 2); norm = Math.max(norm, Math.abs(v)); }
    for (let i = 0; i < sw; i++) { let v = 0; for (let k = 1; k <= N; k++) v += amps[k] * Math.sin(2 * Math.PI * k * i / sw * 2); const y = midY - (v / norm) * wh; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.fillText("summed waveform (timbre)", ox, 210);
  }, [f0, nHarm, rolloff]);

  const N = Math.round(nHarm);
  const explain =
    N <= 1
      ? `Just the fundamental at ${f0} Hz — a single pure sine with no overtones. The waveform is a smooth sinusoid and the timbre sounds hollow, like a tuning fork or flute.`
      : rolloff <= 0.7
      ? `${N} harmonics with a shallow rolloff (${rolloff}) keeps the upper partials loud, so the tone is bright and buzzy — richer high frequencies mean a reedier, more brilliant timbre.`
      : rolloff >= 1.8
      ? `${N} harmonics but a steep rolloff (${rolloff}) means each overtone (${f0 * 2} Hz, ${f0 * 3} Hz, …) fades fast, so the sound stays close to the pure fundamental — dark and mellow.`
      : `Stacking ${N} harmonics on ${f0} Hz — each an integer multiple (${f0 * 2} Hz, ${f0 * 3} Hz, …). Their relative strengths (rolloff ${rolloff}) define the timbre: how a violin and a flute at the same pitch differ.`;

  const code = `import numpy as np
f0, n_harm, rolloff = ${f0}, ${N}, ${rolloff}
t = np.linspace(0, 1 / f0, 2000)  # one period
amps = [1 / k**rolloff for k in range(1, n_harm + 1)]
wave = sum(a * np.sin(2 * np.pi * f0 * k * t) for k, a in enumerate(amps, 1))
wave /= np.max(np.abs(wave))
print("harmonics (Hz):", [f0 * k for k in range(1, n_harm + 1)])
print("peak", wave.max(), "trough", wave.min())`;

  return (
    <StudioChrome title="Harmonic Series" tagline="overtones & timbre"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Fundamental f₀ (Hz)" value={f0} min={55} max={440} step={1} onChange={(v) => update({ f0: v })} />
        <Slider label="Number of harmonics" value={nHarm} min={1} max={12} step={1} onChange={(v) => update({ nHarm: v })} />
        <Slider label="Rolloff (brightness)" value={rolloff} min={0.3} max={2.5} step={0.1} onChange={(v) => update({ rolloff: v })} />
        <p className="mt-3 text-xs text-slate-500">Every musical note is a stack of harmonics — integer multiples of the fundamental. Their relative strengths (the rolloff) define timbre: why a violin and a flute playing the same pitch sound different. The intervals between harmonics also spell out the octave, fifth, and major third that ground Western harmony.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Fundamental" value={`${f0} Hz`} /><Stat label="2nd harmonic" value={`${f0 * 2} Hz (${INTERVAL[2]})`} /><Stat label="3rd harmonic" value={`${f0 * 3} Hz (${INTERVAL[3]})`} /><Stat label="Harmonics" value={String(N)} /><Equation tex={`f_n = n\\,f_0 = n \\times ${f0}\\ \\text{Hz},\\quad n = 1 \\dots ${N}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
