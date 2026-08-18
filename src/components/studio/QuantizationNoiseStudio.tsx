"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { bits: number; freq: number }> = {
  "Telephone (8-bit)": { bits: 8, freq: 2 },
  "Hi-fi (10-bit)": { bits: 10, freq: 3 },
  "Coarse (2-bit)": { bits: 2, freq: 2 },
  "1-bit extreme": { bits: 1, freq: 4 },
};

export function QuantizationNoiseStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ bits, freq }, update] = useShareableNumbers({ bits: 3, freq: 2 });
  const levels = Math.pow(2, bits);
  const snr = 6.02 * bits + 1.76;
  const quant = (v: number) => Math.round((v + 1) / 2 * (levels - 1)) / (levels - 1) * 2 - 1;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cy = H / 2, amp = 110, pw = W - 60;
    // quantization levels
    ctx.strokeStyle = "#1e293b"; for (let l = 0; l < levels; l++) { const v = l / (levels - 1) * 2 - 1; const y = cy - v * amp; ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 30, y); ctx.stroke(); }
    // original
    ctx.strokeStyle = "#0e7490"; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const v = Math.sin(2 * Math.PI * freq * i / pw); const y = cy - v * amp; i ? ctx.lineTo(30 + i, y) : ctx.moveTo(30 + i, y); } ctx.stroke();
    // quantized (staircase)
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const v = quant(Math.sin(2 * Math.PI * freq * i / pw)); const y = cy - v * amp; i ? ctx.lineTo(30 + i, y) : ctx.moveTo(30 + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`${bits}-bit = ${levels} levels · staircase = quantized`, 30, 20);
  }, [bits, freq, levels]);

  const explain =
    bits <= 2
      ? `At ${bits} bits there are only ${levels} levels, so the staircase barely tracks the wave — quantization noise dominates (SNR ≈ ${snr.toFixed(1)} dB).`
      : bits >= 8
      ? `At ${bits} bits the ${levels}-level staircase hugs the original wave and quantization noise is negligible (SNR ≈ ${snr.toFixed(1)} dB).`
      : `Each extra bit halves the step size and adds about 6 dB; ${bits} bits gives ${levels} levels and roughly ${snr.toFixed(1)} dB of SNR.`;

  const code = `import numpy as np
bits, freq = ${bits}, ${freq}
levels = 2 ** bits
t = np.linspace(0, 1, 1000)
sig = np.sin(2 * np.pi * freq * t)
q = np.round((sig + 1) / 2 * (levels - 1)) / (levels - 1) * 2 - 1
noise = sig - q
snr = 6.02 * bits + 1.76
print("levels", levels, "ideal SNR dB", round(snr, 1),
      "rms error", round(np.sqrt((noise ** 2).mean()), 4))`;

  return (
    <StudioChrome title="ADC Quantization Noise" tagline="how many bits is enough?"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Resolution (bits)" value={bits} min={1} max={10} step={1} onChange={(v) => update({ bits: v })} />
        <Slider label="Signal frequency" value={freq} min={1} max={6} step={1} onChange={(v) => update({ freq: v })} />
        <p className="mt-3 text-xs text-slate-500">An analog-to-digital converter rounds each sample to the nearest of 2ᴺ levels, adding quantization noise. Each extra bit halves the step size and adds about 6 dB of signal-to-noise ratio — the famous 6.02N + 1.76 dB rule. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Levels" value={`${levels}`} />
        <Stat label="Ideal SNR" value={`${snr.toFixed(1)} dB`} />
        <Stat label="Step size" value={`${(2 / levels).toFixed(4)}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
