"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function QuantizationNoiseStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [bits, setBits] = useState(3), [freq, setFreq] = useState(2);
  const levels = Math.pow(2, bits);
  const snr = 6.02 * bits + 1.76;
  const quant = (v: number) => Math.round((v + 1) / 2 * (levels - 1)) / (levels - 1) * 2 - 1;

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cy = H / 2, amp = 110, pw = W - 60;
    // quantization levels
    ctx.strokeStyle = "#1e293b"; for (let l = 0; l < levels; l++) { const v = l / (levels - 1) * 2 - 1; const y = cy - v * amp; ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 30, y); ctx.stroke(); }
    // original
    ctx.strokeStyle = "#0e7490"; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const v = Math.sin(2 * Math.PI * freq * i / pw); const y = cy - v * amp; i ? ctx.lineTo(30 + i, y) : ctx.moveTo(30 + i, y); } ctx.stroke();
    // quantized (staircase)
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const v = quant(Math.sin(2 * Math.PI * freq * i / pw)); const y = cy - v * amp; i ? ctx.lineTo(30 + i, y) : ctx.moveTo(30 + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`${bits}-bit = ${levels} levels · staircase = quantized`, 30, 20);
  }, [bits, freq, levels]);

  return (
    <StudioChrome title="ADC Quantization Noise" tagline="how many bits is enough?"
      controls={<div>
        <Slider label="Resolution (bits)" value={bits} min={1} max={10} step={1} onChange={setBits} />
        <Slider label="Signal frequency" value={freq} min={1} max={6} step={1} onChange={setFreq} />
        <p className="mt-3 text-xs text-slate-500">An analog-to-digital converter rounds each sample to the nearest of 2ᴺ levels, adding quantization noise. Each extra bit halves the step size and adds about 6 dB of signal-to-noise ratio — the famous 6.02N + 1.76 dB rule. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Levels" value={`${levels}`} />
        <Stat label="Ideal SNR" value={`${snr.toFixed(1)} dB`} />
        <Stat label="Step size" value={`${(2 / levels).toFixed(4)}`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
