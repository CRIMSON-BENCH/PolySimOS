"use client";

import { useEffect, useMemo, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { useShareableNumbers, hidpi } from "@/lib/studioKit";

const W = 760, N = 256;

const PRESETS: Record<string, { f1: number; f2: number; f3: number; noise: number }> = {
  "Pure tone": { f1: 4, f2: 0, f3: 0, noise: 0 },
  "Two-tone": { f1: 4, f2: 9, f3: 0, noise: 0 },
  "Rich harmonics": { f1: 3, f2: 6, f3: 12, noise: 0 },
  "Tone + noise": { f1: 5, f2: 0, f3: 0, noise: 0.6 },
};

export function FFTStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ f1, f2, f3, noise }, update] = useShareableNumbers({ f1: 4, f2: 9, f3: 0, noise: 0 });

  const { signal, spectrum } = useMemo(() => {
    let s = 12345; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 - 0.5; };
    const sig = new Array(N).fill(0).map((_, i) => { const t = i / N * 2 * Math.PI; return Math.sin(f1 * t) + 0.7 * Math.sin(f2 * t) + (f3 ? 0.5 * Math.sin(f3 * t) : 0) + noise * rnd() * 2; });
    const bins = Math.floor(N / 2); const spec = new Array(bins).fill(0);
    for (let k = 0; k < bins; k++) { let re = 0, im = 0; for (let n = 0; n < N; n++) { const a = (2 * Math.PI * k * n) / N; re += sig[n] * Math.cos(a); im -= sig[n] * Math.sin(a); } spec[k] = Math.hypot(re, im) / N; }
    return { signal: sig, spectrum: spec };
  }, [f1, f2, f3, noise]);

  useEffect(() => {
    const H = 440; const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const pad = 30;
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 1.6; ctx.beginPath();
    signal.forEach((v, i) => { const x = pad + (i / N) * (W - 2 * pad); const y = 110 - v * 30; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("signal (time domain)", pad, 20); ctx.fillText("spectrum (frequency domain)", pad, 240);
    const maxS = Math.max(...spectrum, 0.01); const bw = (W - 2 * pad) / 40;
    for (let k = 0; k < 40; k++) { const h = (spectrum[k] / maxS) * 150; ctx.fillStyle = spectrum[k] / maxS > 0.15 ? "#a3e635" : "#334155"; ctx.fillRect(pad + k * bw, H - 20 - h, bw - 1, h); }
  }, [signal, spectrum]);

  const tones = [f1, f2, f3].filter(Boolean);
  const toneCount = tones.length;
  const explain =
    noise >= 0.4
      ? `A strong noise floor (level ${noise}) spreads energy across every frequency bin, so the ${toneCount === 1 ? "single spike" : `${toneCount} spikes`} at ${tones.join(", ")} rise above a raised, jagged baseline.`
      : toneCount <= 1
      ? `A pure sinusoid at frequency ${tones[0] ?? f1} decomposes into one sharp spike in the spectrum — all the signal's energy sits in a single bin.`
      : `The FFT splits this ${toneCount}-tone signal into bins: each input sinusoid at ${tones.join(", ")} appears as a distinct spike, and with noise at ${noise} the baseline between them stays clean.`;

  const code = `import numpy as np
f1, f2, f3, noise = ${f1}, ${f2}, ${f3}, ${noise}
N = ${N}
rng = np.random.default_rng(0)
t = np.arange(N) / N * 2 * np.pi
sig = np.sin(f1*t) + 0.7*np.sin(f2*t) + (0.5*np.sin(f3*t) if f3 else 0) + noise*(rng.random(N)-0.5)*2
spec = np.abs(np.fft.rfft(sig)) / N
peaks = np.argsort(spec)[::-1][:3]
print("dominant bins", sorted(peaks))`;

  return (
    <StudioChrome title="Fourier Transform (FFT)" tagline="decompose a signal into frequencies"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Build a signal from a few sine tones plus noise, and the discrete Fourier transform recovers exactly which frequencies are present — the foundation of all signal processing.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Tone 1 frequency" value={f1} min={1} max={20} step={1} onChange={(v) => update({ f1: v })} />
        <Slider label="Tone 2 frequency" value={f2} min={0} max={20} step={1} onChange={(v) => update({ f2: v })} />
        <Slider label="Tone 3 frequency" value={f3} min={0} max={20} step={1} onChange={(v) => update({ f3: v })} />
        <Slider label="Noise" value={noise} min={0} max={1} step={0.05} onChange={(v) => update({ noise: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Samples" value={String(N)} /><Stat label="Peaks at" value={tones.join(", ") || "—"} /><Stat label="Transform" value="DFT" /><Equation tex={`X_k = \\sum_{n=0}^{N-1} x_n\\, e^{-2\\pi i k n / N}\\quad (N = ${N},\\ \\mathcal{O}(N\\log N))`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={440} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
