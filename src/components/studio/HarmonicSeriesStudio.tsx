"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const INTERVAL = ["", "unison", "octave", "fifth", "octave", "major 3rd", "fifth", "min 7th", "octave"];

export function HarmonicSeriesStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [f0, setF0] = useState(110);
  const [nHarm, setNHarm] = useState(8);
  const [rolloff, setRolloff] = useState(1);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 540, H = 340; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
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

  return (
    <StudioChrome title="Harmonic Series" tagline="overtones & timbre"
      controls={<div>
        <Slider label="Fundamental f₀ (Hz)" value={f0} min={55} max={440} step={1} onChange={setF0} />
        <Slider label="Number of harmonics" value={nHarm} min={1} max={12} step={1} onChange={setNHarm} />
        <Slider label="Rolloff (brightness)" value={rolloff} min={0.3} max={2.5} step={0.1} onChange={setRolloff} />
        <p className="mt-3 text-xs text-slate-500">Every musical note is a stack of harmonics — integer multiples of the fundamental. Their relative strengths (the rolloff) define timbre: why a violin and a flute playing the same pitch sound different. The intervals between harmonics also spell out the octave, fifth, and major third that ground Western harmony.</p>
      </div>}
      inspector={<div><Stat label="Fundamental" value={`${f0} Hz`} /><Stat label="2nd harmonic" value={`${f0 * 2} Hz (${INTERVAL[2]})`} /><Stat label="3rd harmonic" value={`${f0 * 3} Hz (${INTERVAL[3]})`} /><Stat label="Harmonics" value={String(Math.round(nHarm))} /></div>}
    ><canvas ref={canvasRef} width={540} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
