"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const N = 120;

export function PercolationStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [p, setP] = useState(0.6);
  const [seed, setSeed] = useState(1);

  const { open, filled, percolates } = useMemo(() => {
    let s = seed >>> 0; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const open = new Uint8Array(N * N); for (let i = 0; i < N * N; i++) open[i] = rnd() < p ? 1 : 0;
    const filled = new Uint8Array(N * N); const stack: number[] = [];
    for (let x = 0; x < N; x++) if (open[x]) { filled[x] = 1; stack.push(x); }
    while (stack.length) { const i = stack.pop()!; const x = i % N, y = (i / N) | 0; const nb = [x + 1 < N ? i + 1 : -1, x - 1 >= 0 ? i - 1 : -1, y + 1 < N ? i + N : -1, y - 1 >= 0 ? i - N : -1]; for (const j of nb) if (j >= 0 && open[j] && !filled[j]) { filled[j] = 1; stack.push(j); } }
    let percolates = false; for (let x = 0; x < N; x++) if (filled[(N - 1) * N + x]) { percolates = true; break; }
    return { open, filled, percolates };
  }, [p, seed]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const img = ctx.createImageData(N, N);
    for (let i = 0; i < N * N; i++) { let r = 15, g = 23, b = 42; if (filled[i]) { r = 34; g = 211; b = 238; } else if (open[i]) { r = 71; g = 85; b = 105; } img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255; }
    ctx.putImageData(img, 0, 0);
  }, [open, filled]);

  return (
    <StudioChrome title="Percolation Studio" tagline="phase transition · spanning clusters"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Each cell is open with probability p. Water poured on top (cyan) seeps through connected open cells. Near p ≈ 0.59 a spanning path suddenly appears — a phase transition.</p>
        <Slider label="Open probability p" value={p} min={0.3} max={0.85} step={0.01} onChange={setP} />
        <button onClick={() => setSeed((s) => s + 1)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">New sample</button>
      </div>}
      inspector={<div><Stat label="p" value={p.toFixed(2)} /><Stat label="Percolates?" value={percolates ? "yes ✓" : "no"} /><Stat label="p_critical" value="≈ 0.593" /></div>}
    ><canvas ref={canvasRef} width={N} height={N} className="mx-auto h-auto max-h-[440px] rounded-lg" style={{ imageRendering: "pixelated", width: "440px" }} /></StudioChrome>
  );
}
