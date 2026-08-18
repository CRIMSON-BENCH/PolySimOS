"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

type Wave = "sawtooth" | "square" | "triangle";
function amp(wave: Wave, k: number): number {
  if (wave === "sawtooth") return 1 / k;
  if (wave === "square") return k % 2 ? 1 / k : 0;
  return k % 2 ? (((k - 1) / 2) % 2 ? -1 : 1) / (k * k) : 0; // triangle
}

const PRESETS: Record<string, { wave: Wave; nHarm: number }> = {
  "Pure fundamental": { wave: "sawtooth", nHarm: 1 },
  "Rich sawtooth": { wave: "sawtooth", nHarm: 16 },
  "Hollow square": { wave: "square", nHarm: 12 },
  "Soft triangle": { wave: "triangle", nHarm: 6 },
};

export function AdditiveSynthStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wave, setWave] = useState<Wave>("sawtooth");
  const [{ nHarm }, update] = useShareableNumbers({ nHarm: 8 });

  useEffect(() => {
    const W = 540, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const N = Math.round(nHarm); const ox = 30, sw = W - 60;
    // reconstructed wave
    const midY = 110, wh = 70; ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    let norm = 0; for (let i = 0; i < sw; i++) { let v = 0; for (let k = 1; k <= N; k++) v += amp(wave, k) * Math.sin(2 * Math.PI * k * i / sw * 2); norm = Math.max(norm, Math.abs(v)); }
    for (let i = 0; i < sw; i++) { let v = 0; for (let k = 1; k <= N; k++) v += amp(wave, k) * Math.sin(2 * Math.PI * k * i / sw * 2); const y = midY - (v / norm) * wh; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`${wave} reconstructed from ${N} harmonics`, ox, 20);
    // harmonic bars
    const barY = 290; for (let k = 1; k <= N; k++) { const a = Math.abs(amp(wave, k)); const x = ox + (k / (N + 1)) * sw; ctx.fillStyle = "#f472b6"; ctx.fillRect(x - 6, barY - a * 120, 12, a * 120); ctx.fillStyle = "#64748b"; ctx.font = "9px sans-serif"; ctx.fillText(`${k}`, x - 3, barY + 12); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("harmonic amplitudes", ox, 175);
  }, [wave, nHarm]);

  const N = Math.round(nHarm);
  const explain = N <= 1
    ? "A single harmonic is just a pure sine tone — the sawtooth, square and triangle only take shape once you stack more."
    : wave === "triangle"
    ? `The triangle uses only odd harmonics falling as 1/k², so its ${N}-harmonic sum is already smooth with barely any Gibbs ripple.`
    : wave === "square"
    ? `The square keeps only odd harmonics falling as 1/k, so even with ${N} of them the edges stay sharp and show Gibbs overshoot.`
    : `The sawtooth needs every harmonic falling as 1/k; ${N} of them sharpen the ramp but leave a Gibbs ripple at the jump.`;

  const code = `import numpy as np
wave, N = "${wave}", ${N}
t = np.linspace(0, 1, 1000, endpoint=False)
def amp(k):
    if wave == "sawtooth": return 1 / k
    if wave == "square":   return 1 / k if k % 2 else 0
    return ((-1) ** ((k - 1) // 2)) / k ** 2 if k % 2 else 0  # triangle
y = sum(amp(k) * np.sin(2 * np.pi * k * 2 * t) for k in range(1, N + 1))
print("peak", np.abs(y).max())`;

  return (
    <StudioChrome title="Additive Synthesis" tagline="building tone from sine waves"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => { const p = PRESETS[label]; setWave(p.wave); update({ nHarm: p.nHarm }); }} />
        <div className="mb-3 grid grid-cols-3 gap-2">{(["sawtooth", "square", "triangle"] as Wave[]).map((w) => <button key={w} onClick={() => setWave(w)} className={`rounded-lg px-1 py-1 text-xs font-semibold capitalize ${wave === w ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{w}</button>)}</div>
        <Slider label="Harmonics" value={nHarm} min={1} max={24} step={1} onChange={(v) => update({ nHarm: v })} />
        <p className="mt-3 text-xs text-slate-500">Any periodic waveform is a sum of sine harmonics — the basis of additive synthesis. A sawtooth needs every harmonic falling as 1/k; a square only odd harmonics; a triangle odd harmonics falling as 1/k². Add more harmonics to sharpen the shape, and watch the Gibbs overshoot ripple at the edges.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Waveform" value={wave} /><Stat label="Harmonics" value={String(Math.round(nHarm))} /><Stat label="Content" value={wave === "square" || wave === "triangle" ? "odd only" : "all"} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
