"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const N = 220, PX = 2;

export function WaveInterferenceStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [freq, setFreq] = useState(0.4);
  const [sep, setSep] = useState(50);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    const img = ctx.createImageData(N, N);
    let t = 0;
    const loop = () => {
      if (running) t += 0.3;
      const s1x = N / 2 - sep, s1y = N / 2, s2x = N / 2 + sep, s2y = N / 2;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const d1 = Math.hypot(x - s1x, y - s1y), d2 = Math.hypot(x - s2x, y - s2y);
        const a = Math.sin(freq * d1 - t) / (1 + d1 * 0.03) + Math.sin(freq * d2 - t) / (1 + d2 * 0.03);
        const v = (a + 2) / 4; const i = (y * N + x) * 4;
        img.data[i] = v * 60; img.data[i + 1] = v * 200; img.data[i + 2] = v * 255; img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, freq, sep]);

  return (
    <StudioChrome title="Wave Interference Studio" tagline="two-source interference · ripple tank"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button></div>
        <p className="mb-3 text-xs text-slate-500">Two point sources emit circular waves — where they meet, you see constructive and destructive interference fringes.</p>
        <Slider label="Frequency" value={freq} min={0.1} max={1} step={0.05} onChange={setFreq} />
        <Slider label="Source separation" value={sep} min={10} max={90} step={5} onChange={setSep} />
      </div>}
      inspector={<div><Stat label="Sources" value="2" /><Stat label="Grid" value={`${N}×${N}`} /><Stat label="Pattern" value="interference fringes" /></div>}
    >
      <canvas ref={canvasRef} width={N} height={N} className="mx-auto h-auto max-h-[440px] rounded-lg" style={{ imageRendering: "pixelated", width: `${N * PX}px` }} />
    </StudioChrome>
  );
}
