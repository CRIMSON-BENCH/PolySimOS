"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { useShareableNumbers } from "@/lib/studioKit";

const N = 120;
const P_C = 0.5927; // site-percolation threshold on a 2D square lattice

const PRESETS: Record<string, { p: number }> = {
  "Sparse (p=0.4)": { p: 0.4 },
  "Below threshold (0.55)": { p: 0.55 },
  "At threshold (0.59)": { p: 0.59 },
  "Above (0.7)": { p: 0.7 },
};

export function PercolationStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ p }, update] = useShareableNumbers({ p: 0.6 });
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

  const explain =
    p < 0.5
      ? `Well below p_c ≈ ${P_C}: open cells are scattered into small isolated clusters, so water can't cross the grid — there is no spanning path.`
      : p < P_C - 0.005
      ? `Just below the threshold p_c ≈ ${P_C}: clusters are growing and merging, but they still stop short of the far edge. Percolation is unlikely and sample-dependent.`
      : p < P_C + 0.01
      ? `Right at the critical point p_c ≈ ${P_C}: a spanning cluster first appears. This is a continuous (second-order) phase transition — the crossing probability rises sharply here and the connected cluster is fractal.`
      : `Above p_c ≈ ${P_C}: a single giant cluster dominates and connects edge to edge, so water percolates through almost every sample.`;

  const code = `import numpy as np
from scipy.ndimage import label

N, p = ${N}, ${p}
rng = np.random.default_rng(0)
grid = rng.random((N, N)) < p          # each site open with probability p

# label connected clusters of open sites (4-neighbour connectivity)
lbl, n = label(grid, structure=[[0, 1, 0], [1, 1, 1], [0, 1, 0]])

# percolates if any cluster touches both the top and bottom row
top, bottom = set(lbl[0]) - {0}, set(lbl[-1]) - {0}
spanning = top & bottom
print("p_c (square-lattice site) ~ ${P_C}")
print("clusters:", n, "| percolates:", bool(spanning))`;

  return (
    <StudioChrome title="Percolation Studio" tagline="phase transition · spanning clusters"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">{'Each cell is open with probability p. Water poured on top (cyan) seeps through connected open cells. Near p ≈ 0.59 a spanning path suddenly appears — a phase transition.'}</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Open probability p" value={p} min={0.3} max={0.85} step={0.01} onChange={(v) => update({ p: v })} />
        <button onClick={() => setSeed((s) => s + 1)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">New sample</button>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="p" value={p.toFixed(2)} />
        <Stat label="Percolates?" value={percolates ? "yes ✓" : "no"} />
        <Stat label="p_critical" value="≈ 0.593" />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={N} height={N} className="mx-auto h-auto max-h-[440px] rounded-lg" style={{ imageRendering: "pixelated", width: "440px" }} /></StudioChrome>
  );
}
