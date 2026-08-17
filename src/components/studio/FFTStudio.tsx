"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 760, N = 256;

export function FFTStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [f1, setF1] = useState(4);
  const [f2, setF2] = useState(9);
  const [f3, setF3] = useState(0);
  const [noise, setNoise] = useState(0);

  const { signal, spectrum } = useMemo(() => {
    let s = 12345; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 - 0.5; };
    const sig = new Array(N).fill(0).map((_, i) => { const t = i / N * 2 * Math.PI; return Math.sin(f1 * t) + 0.7 * Math.sin(f2 * t) + (f3 ? 0.5 * Math.sin(f3 * t) : 0) + noise * rnd() * 2; });
    const bins = Math.floor(N / 2); const spec = new Array(bins).fill(0);
    for (let k = 0; k < bins; k++) { let re = 0, im = 0; for (let n = 0; n < N; n++) { const a = (2 * Math.PI * k * n) / N; re += sig[n] * Math.cos(a); im -= sig[n] * Math.sin(a); } spec[k] = Math.hypot(re, im) / N; }
    return { signal: sig, spectrum: spec };
  }, [f1, f2, f3, noise]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const H = 440;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const pad = 30;
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 1.6; ctx.beginPath();
    signal.forEach((v, i) => { const x = pad + (i / N) * (W - 2 * pad); const y = 110 - v * 30; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("signal (time domain)", pad, 20); ctx.fillText("spectrum (frequency domain)", pad, 240);
    const maxS = Math.max(...spectrum, 0.01); const bw = (W - 2 * pad) / 40;
    for (let k = 0; k < 40; k++) { const h = (spectrum[k] / maxS) * 150; ctx.fillStyle = spectrum[k] / maxS > 0.15 ? "#a3e635" : "#334155"; ctx.fillRect(pad + k * bw, H - 20 - h, bw - 1, h); }
  }, [signal, spectrum]);

  return (
    <StudioChrome title="Fourier Transform (FFT)" tagline="decompose a signal into frequencies"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Build a signal from a few sine tones plus noise, and the discrete Fourier transform recovers exactly which frequencies are present — the foundation of all signal processing.</p>
        <Slider label="Tone 1 frequency" value={f1} min={1} max={20} step={1} onChange={setF1} />
        <Slider label="Tone 2 frequency" value={f2} min={0} max={20} step={1} onChange={setF2} />
        <Slider label="Tone 3 frequency" value={f3} min={0} max={20} step={1} onChange={setF3} />
        <Slider label="Noise" value={noise} min={0} max={1} step={0.05} onChange={setNoise} />
      </div>}
      inspector={<div><Stat label="Samples" value={String(N)} /><Stat label="Peaks at" value={[f1, f2, f3].filter(Boolean).join(", ")} /><Stat label="Transform" value="DFT" /></div>}
    ><canvas ref={canvasRef} width={W} height={440} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
