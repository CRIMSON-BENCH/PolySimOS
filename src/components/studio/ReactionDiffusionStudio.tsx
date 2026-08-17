"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";

const N = 160;

const PRESETS: Record<string, [number, number]> = {
  "Coral": [0.0545, 0.062], "Mitosis": [0.0367, 0.0649], "Spots": [0.03, 0.062], "Maze": [0.029, 0.057], "Waves": [0.014, 0.054],
};

export function ReactionDiffusionStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preset, setPreset] = useState("Coral");
  const [running, setRunning] = useState(true);
  const [seed, setSeed] = useState(1);
  const [iter, setIter] = useState(0);

  useEffect(() => {
    if (!running) return; let raf = 0;
    let a = new Float32Array(N * N).fill(1); let b = new Float32Array(N * N);
    let s = seed * 7 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let k = 0; k < 12; k++) { const cx = (rnd() * N) | 0, cy = (rnd() * N) | 0; for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) { const nx = cx + x, ny = cy + y; if (nx >= 0 && ny >= 0 && nx < N && ny < N) b[ny * N + nx] = 1; } }
    const Da = 1.0, Db = 0.5; const [f, kk] = PRESETS[preset];
    const img = canvasRef.current!.getContext("2d")!.createImageData(N, N);
    let count = 0;
    const loop = () => {
      for (let step = 0; step < 10; step++) {
        const na = new Float32Array(N * N), nb = new Float32Array(N * N);
        for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { const i = y * N + x;
          const lapA = a[i - 1] + a[i + 1] + a[i - N] + a[i + N] - 4 * a[i];
          const lapB = b[i - 1] + b[i + 1] + b[i - N] + b[i + N] - 4 * b[i];
          const abb = a[i] * b[i] * b[i];
          na[i] = a[i] + (Da * lapA - abb + f * (1 - a[i]));
          nb[i] = b[i] + (Db * lapB + abb - (kk + f) * b[i]);
        }
        a = na; b = nb; count++;
      }
      const ctx = canvasRef.current!.getContext("2d")!;
      for (let i = 0; i < N * N; i++) { const v = Math.max(0, Math.min(1, a[i] - b[i])); const idx = i * 4;
        img.data[idx] = 20 + v * 60; img.data[idx + 1] = 40 + (1 - v) * 180; img.data[idx + 2] = 60 + (1 - v) * 160; img.data[idx + 3] = 255; }
      ctx.putImageData(img, 0, 0); setIter(count);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, preset, seed]);

  return (
    <StudioChrome title="Reaction-Diffusion (Gray-Scott)" tagline="Turing patterns from chemistry"
      controls={<div>
        <div className="mb-3 grid grid-cols-3 gap-2">{Object.keys(PRESETS).map((k) => <button key={k} onClick={() => setPreset(k)} className={`rounded-lg px-2 py-1 text-xs font-semibold ${preset === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{k}</button>)}</div>
        <div className="flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={() => setSeed((n) => n + 1)} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reseed</button></div>
        <p className="mt-3 text-xs text-slate-500">Two chemicals diffuse and react by the Gray-Scott equations. Different feed and kill rates spontaneously form spots, stripes, and mazes — the mechanism Alan Turing proposed for animal coat patterns.</p>
      </div>}
      inspector={<div><Stat label="Pattern" value={preset} /><Stat label="Feed f" value={PRESETS[preset][0].toFixed(4)} /><Stat label="Kill k" value={PRESETS[preset][1].toFixed(4)} /></div>}
    ><canvas ref={canvasRef} width={N} height={N} className="mx-auto h-auto max-w-full rounded-lg" style={{ imageRendering: "pixelated", width: 480, height: 480 }} /></StudioChrome>
  );
}
