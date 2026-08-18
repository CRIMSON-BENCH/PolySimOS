"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const WINDOWS: Record<string, (n: number, N: number) => number> = {
  Rectangular: () => 1,
  Hann: (n, N) => 0.5 - 0.5 * Math.cos(2 * Math.PI * n / (N - 1)),
  Hamming: (n, N) => 0.54 - 0.46 * Math.cos(2 * Math.PI * n / (N - 1)),
  Blackman: (n, N) => 0.42 - 0.5 * Math.cos(2 * Math.PI * n / (N - 1)) + 0.08 * Math.cos(4 * Math.PI * n / (N - 1)),
};

export function WindowFunctionsStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [win, setWin] = useState("Hann");
  const N = 64; const w = WINDOWS[win];
  const spec = (k: number) => { let re = 0, im = 0; for (let n = 0; n < N; n++) { const v = w(n, N); re += v * Math.cos(2 * Math.PI * k * n / 512); im -= v * Math.sin(2 * Math.PI * k * n / 512); } return Math.sqrt(re * re + im * im); };

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // window shape (top)
    ctx.strokeStyle = "#0e7490"; ctx.lineWidth = 2; ctx.beginPath(); for (let n = 0; n < N; n++) { const x = 40 + n / N * (W - 60), y = 90 - w(n, N) * 55; n ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`${win} window shape`, 40, 22);
    // spectrum in dB (bottom) — leakage
    const oy = H - 24; ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(40, oy); ctx.lineTo(W - 20, oy); ctx.stroke();
    const peak = spec(0); ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k < 60; k++) { const db = 20 * Math.log10((spec(k) + 1e-6) / peak); const x = 40 + k / 60 * (W - 60), y = 150 - Math.max(-80, db) / 80 * 120; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.fillText("spectral leakage (dB) — lower side lobes = less leakage", 40, 148);
  }, [win]);

  return (
    <StudioChrome title="Window Functions" tagline="taming spectral leakage"
      controls={<div>
        <label className="mb-2 block text-xs text-slate-400">Window</label>
        <select value={win} onChange={(e) => setWin(e.target.value)} className="mb-3 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">{Object.keys(WINDOWS).map((k) => <option key={k} value={k}>{k}</option>)}</select>
        <p className="mt-3 text-xs text-slate-500">Chopping a signal into a finite chunk smears its spectrum — spectral leakage. Tapering the chunk with a window (Hann, Hamming, Blackman) trades a wider main lobe for much lower side lobes, cleaning up the spectrum. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Window" value={win} />
        <Stat label="Trade-off" value={win === "Rectangular" ? "sharp but leaky" : win === "Blackman" ? "low leakage, wide lobe" : "balanced"} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
