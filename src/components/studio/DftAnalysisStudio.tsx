"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function DftAnalysisStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [f1, setF1] = useState(5), [f2, setF2] = useState(12), [a2, setA2] = useState(0.6), [noise, setNoise] = useState(0);
  const N = 128;
  const sig = (n: number) => Math.sin(2 * Math.PI * f1 * n / N) + a2 * Math.sin(2 * Math.PI * f2 * n / N) + noise * (((n * 9301 + 49297) % 233280) / 233280 - 0.5);
  const spectrum: number[] = []; for (let k = 0; k < N / 2; k++) { let re = 0, im = 0; for (let n = 0; n < N; n++) { re += sig(n) * Math.cos(2 * Math.PI * k * n / N); im -= sig(n) * Math.sin(2 * Math.PI * k * n / N); } spectrum.push(Math.sqrt(re * re + im * im) / N * 2); }

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // signal (top)
    ctx.strokeStyle = "#0e7490"; ctx.lineWidth = 1.5; ctx.beginPath(); for (let n = 0; n < N; n++) { const x = 40 + n / N * (W - 60), y = 70 - sig(n) * 22; n ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("time signal", 40, 20);
    // spectrum (bottom)
    const oy = H - 30, maxs = Math.max(...spectrum, 0.01); ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(40, oy); ctx.lineTo(W - 20, oy); ctx.stroke();
    spectrum.forEach((v, k) => { const x = 40 + k / (N / 2) * (W - 60); const h = v / maxs * 120; ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, oy - h); ctx.stroke(); });
    ctx.fillStyle = "#94a3b8"; ctx.fillText("DFT magnitude spectrum — peaks reveal the frequencies", 40, 150);
  }, [f1, f2, a2, noise]);

  return (
    <StudioChrome title="DFT Spectrum Analysis" tagline="finding hidden frequencies"
      controls={<div>
        <Slider label="Frequency 1 (cycles)" value={f1} min={1} max={30} step={1} onChange={setF1} />
        <Slider label="Frequency 2 (cycles)" value={f2} min={1} max={30} step={1} onChange={setF2} />
        <Slider label="Amplitude 2" value={a2} min={0} max={1} step={0.05} onChange={setA2} />
        <Slider label="Noise" value={noise} min={0} max={1} step={0.05} onChange={setNoise} />
        <p className="mt-3 text-xs text-slate-500">The Discrete Fourier Transform decomposes a signal into its constituent frequencies. A messy time-domain wave becomes clean peaks in the spectrum — the mathematics behind audio equalizers, MRI, and Wi-Fi. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Peak 1" value={`${f1} cycles`} />
        <Stat label="Peak 2" value={`${f2} cycles`} />
        <Stat label="Resolution" value={`${(1 / N).toFixed(3)} cyc/sample`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
