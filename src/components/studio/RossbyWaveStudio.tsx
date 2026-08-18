"use client";

import { useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { waveNum: number; amplitude: number }> = {
  "Zonal (calm)": { waveNum: 6, amplitude: 15 },
  "Meridional (blocking)": { waveNum: 3, amplitude: 80 },
  "Long waves": { waveNum: 2, amplitude: 50 },
  "Short waves": { waveNum: 8, amplitude: 30 },
};

// Rossby (planetary) waves in the jet stream.
export function RossbyWaveStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ waveNum, amplitude }, update] = useShareableNumbers({ waveNum: 4, amplitude: 50 });
  const waveNumRef = useRef(waveNum); waveNumRef.current = waveNum;
  const amplitudeRef = useRef(amplitude); amplitudeRef.current = amplitude;
  const phase = useRef(0);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const waveNum = waveNumRef.current, amplitude = amplitudeRef.current;
    // Rossby: waves propagate westward relative to flow; longer waves faster westward
    const westward = 20 / (waveNum * waveNum);
    phase.current += 0.02 * (1 - westward / 10) * steps; const t = phase.current; const W = 540, H = 300;
    const ctx = hidpi(canvas, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cy = H / 2;
    // cold north / warm south shading
    ctx.fillStyle = "rgba(96,165,250,0.08)"; ctx.fillRect(0, 0, W, cy); ctx.fillStyle = "rgba(249,115,22,0.06)"; ctx.fillRect(0, cy, W, cy);
    // jet stream wave
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 3; ctx.beginPath(); for (let x = 0; x <= W; x += 3) { const y = cy - amplitude * Math.sin(waveNum * x / W * 6.283 - t); x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("cold polar air", 12, 20); ctx.fillText("warm tropical air", 12, H - 10); ctx.fillStyle = "#bef264"; ctx.fillText("jet stream (Rossby wave)", W - 170, 20);
  };

  const tr = useTransport(frame);

  const explain =
    amplitude > 65
      ? `Large-amplitude, low-wavenumber meanders like this tend to stall into a blocking pattern that can lock in heat waves, cold snaps, and floods for days.`
      : waveNum >= 6
      ? `A high wave number packs many short waves around the hemisphere — a fast, near-zonal flow that hustles weather systems along quickly.`
      : `A few long Rossby waves with this ${(40000 / waveNum).toFixed(0)} km wavelength drift westward relative to the jet and steer the mid-latitude storm track.`;

  const code = `import numpy as np
wave_num, amplitude = ${waveNum}, ${amplitude}
x = np.linspace(0, 1, 400)
y = amplitude * np.sin(wave_num * x * 2*np.pi)
westward = 20 / wave_num**2  # long waves drift faster west
print("wavelength_km", 40000/wave_num, "westward_drift", westward)`;

  return (
    <StudioChrome title="Rossby Waves" tagline="the meandering jet stream"
      controls={<div>
        <TransportBar playing={tr.playing} onToggle={tr.toggle} onStep={tr.step} speed={tr.speed} onSpeed={tr.setSpeed} />
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Wave number" value={waveNum} min={2} max={8} step={1} onChange={(v) => update({ waveNum: v })} />
        <Slider label="Amplitude" value={amplitude} min={10} max={90} step={5} onChange={(v) => update({ amplitude: v })} />
        <p className="mt-3 text-xs text-slate-500">The jet stream does not flow straight — it meanders in giant planetary Rossby waves, driven by the Earth&apos;s rotation varying with latitude. These waves carry weather systems around the globe and, when they grow large and stall, lock in heat waves, cold snaps, and floods. A few long waves circle the whole hemisphere.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Wave number" value={String(waveNum)} /><Stat label="Wavelength" value={`${(40000 / waveNum).toFixed(0)} km`} /><Stat label="Drift" value="westward vs flow" /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
