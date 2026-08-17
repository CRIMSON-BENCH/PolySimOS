"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

type Wave = "sawtooth" | "square" | "triangle";
function amp(wave: Wave, k: number): number {
  if (wave === "sawtooth") return 1 / k;
  if (wave === "square") return k % 2 ? 1 / k : 0;
  return k % 2 ? (((k - 1) / 2) % 2 ? -1 : 1) / (k * k) : 0; // triangle
}

export function AdditiveSynthStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wave, setWave] = useState<Wave>("sawtooth");
  const [nHarm, setNHarm] = useState(8);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 540, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
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

  return (
    <StudioChrome title="Additive Synthesis" tagline="building tone from sine waves"
      controls={<div>
        <div className="mb-3 grid grid-cols-3 gap-2">{(["sawtooth", "square", "triangle"] as Wave[]).map((w) => <button key={w} onClick={() => setWave(w)} className={`rounded-lg px-1 py-1 text-xs font-semibold capitalize ${wave === w ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{w}</button>)}</div>
        <Slider label="Harmonics" value={nHarm} min={1} max={24} step={1} onChange={setNHarm} />
        <p className="mt-3 text-xs text-slate-500">Any periodic waveform is a sum of sine harmonics — the basis of additive synthesis. A sawtooth needs every harmonic falling as 1/k; a square only odd harmonics; a triangle odd harmonics falling as 1/k². Add more harmonics to sharpen the shape, and watch the Gibbs overshoot ripple at the edges.</p>
      </div>}
      inspector={<div><Stat label="Waveform" value={wave} /><Stat label="Harmonics" value={String(Math.round(nHarm))} /><Stat label="Content" value={wave === "square" || wave === "triangle" ? "odd only" : "all"} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
