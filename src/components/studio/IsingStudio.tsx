"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// 2D Ising model — Metropolis Monte Carlo. Tune temperature through the
// critical point (~2.27 J/k_B) to watch spontaneous magnetization vanish.
const N = 150;

export function IsingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spins = useRef<Int8Array>(new Int8Array(N * N));
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [temp, setTemp] = useState(2.2);
  const [mag, setMag] = useState(0);

  const reset = () => { for (let i = 0; i < N * N; i++) spins.current[i] = Math.random() < 0.5 ? 1 : -1; };
  useEffect(() => { reset(); }, []);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    const img = ctx.createImageData(N, N);
    let frame = 0;
    const loop = () => {
      const s = spins.current;
      if (running) {
        const beta = 1 / Math.max(0.05, temp);
        for (let k = 0; k < N * N; k++) {
          const x = (Math.random() * N) | 0, y = (Math.random() * N) | 0, i = y * N + x;
          const nb = s[((y - 1 + N) % N) * N + x] + s[((y + 1) % N) * N + x] + s[y * N + (x - 1 + N) % N] + s[y * N + (x + 1) % N];
          const dE = 2 * s[i] * nb;
          if (dE <= 0 || Math.random() < Math.exp(-beta * dE)) s[i] = -s[i] as -1 | 1;
        }
      }
      let m = 0;
      for (let i = 0; i < N * N; i++) { const up = s[i] > 0; m += s[i]; const c = up ? 210 : 40; img.data[i * 4] = up ? 34 : 15; img.data[i * 4 + 1] = up ? 211 : 23; img.data[i * 4 + 2] = c; img.data[i * 4 + 3] = 255; }
      ctx.putImageData(img, 0, 0);
      if (frame++ % 10 === 0) setMag(Math.abs(m) / (N * N));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, temp]);

  return (
    <StudioChrome title="Ising Model Studio" tagline="statistical mechanics · Metropolis Monte Carlo"
      controls={<div>
        <div className="mb-3 flex gap-2">
          <button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button>
          <button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Randomize</button>
        </div>
        <p className="mb-3 text-xs text-slate-500">Below the critical temperature (~2.27) domains align; above it, thermal noise wins. A live phase transition.</p>
        <Slider label="Temperature (J/k_B)" value={temp} min={0.5} max={4} step={0.05} onChange={setTemp} />
      </div>}
      inspector={<div><Stat label="Lattice" value={`${N}×${N}`} /><Stat label="Magnetization" value={mag.toFixed(3)} /><Stat label="T_critical" value="≈ 2.27" /><Stat label="Phase" value={temp < 2.27 ? "ordered" : "disordered"} /></div>}
    >
      <canvas ref={canvasRef} width={N} height={N} className="mx-auto h-auto max-h-[440px] rounded-lg" style={{ imageRendering: "pixelated", width: "440px" }} />
    </StudioChrome>
  );
}
