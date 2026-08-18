"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";

const PRESETS: Record<string, { f1: number; f2: number; a2: number; noise: number }> = {
  "Two clean tones": { f1: 5, f2: 12, a2: 0.6, noise: 0 },
  "Buried in noise": { f1: 5, f2: 12, a2: 0.6, noise: 0.9 },
  "Close frequencies": { f1: 8, f2: 10, a2: 1, noise: 0 },
  "Faint harmonic": { f1: 4, f2: 20, a2: 0.15, noise: 0.1 },
};

export function DftAnalysisStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ f1, f2, a2, noise }, update] = useShareableNumbers({ f1: 5, f2: 12, a2: 0.6, noise: 0 });
  const N = 128;
  const sig = (n: number) => Math.sin(2 * Math.PI * f1 * n / N) + a2 * Math.sin(2 * Math.PI * f2 * n / N) + noise * (((n * 9301 + 49297) % 233280) / 233280 - 0.5);
  const spectrum: number[] = []; for (let k = 0; k < N / 2; k++) { let re = 0, im = 0; for (let n = 0; n < N; n++) { re += sig(n) * Math.cos(2 * Math.PI * k * n / N); im -= sig(n) * Math.sin(2 * Math.PI * k * n / N); } spectrum.push(Math.sqrt(re * re + im * im) / N * 2); }

  const explain =
    Math.abs(f1 - f2) <= 2
      ? "The two tones sit within a couple of bins of each other, so their spectral peaks nearly merge — DFT resolution (1/N per bin) sets how close two frequencies can be and still be told apart."
      : noise >= 0.6
      ? "Heavy noise raises the spectral floor, yet the two sinusoids still stand out as sharp peaks — the DFT concentrates periodic energy while noise spreads flat across all bins."
      : a2 < 0.25
      ? "The second tone is faint, so its peak is short but still clearly located at its frequency — the DFT detects weak periodic components buried under a dominant one."
      : "Two clean sinusoids produce two crisp peaks at their frequencies; peak height tracks amplitude, which is exactly how an equalizer reads a signal.";

  const code = `import numpy as np
f1, f2, a2, noise, N = ${f1}, ${f2}, ${a2}, ${noise}, ${N}
n = np.arange(N)
rng = (((n*9301+49297) % 233280) / 233280 - 0.5)
sig = np.sin(2*np.pi*f1*n/N) + a2*np.sin(2*np.pi*f2*n/N) + noise*rng
spec = np.abs(np.fft.rfft(sig)) / N * 2
print("peak bins", np.argsort(spec)[-2:])`;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
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
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Frequency 1 (cycles)" value={f1} min={1} max={30} step={1} onChange={(v) => update({ f1: v })} />
        <Slider label="Frequency 2 (cycles)" value={f2} min={1} max={30} step={1} onChange={(v) => update({ f2: v })} />
        <Slider label="Amplitude 2" value={a2} min={0} max={1} step={0.05} onChange={(v) => update({ a2: v })} />
        <Slider label="Noise" value={noise} min={0} max={1} step={0.05} onChange={(v) => update({ noise: v })} />
        <p className="mt-3 text-xs text-slate-500">The Discrete Fourier Transform decomposes a signal into its constituent frequencies. A messy time-domain wave becomes clean peaks in the spectrum — the mathematics behind audio equalizers, MRI, and Wi-Fi. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Peak 1" value={`${f1} cycles`} />
        <Stat label="Peak 2" value={`${f2} cycles`} />
        <Stat label="Resolution" value={`${(1 / N).toFixed(3)} cyc/sample`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
