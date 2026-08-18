"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { m: number; n: number }> = {
  "Simple (2,1)": { m: 1, n: 2 },
  "Star (4,2)": { m: 2, n: 4 },
  "Lattice (5,3)": { m: 3, n: 5 },
  "Dense (7,4)": { m: 4, n: 7 },
};

// Chladni plate nodal patterns: superposition of plate modes.
export function ChladniStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ m, n }, update] = useShareableNumbers({ m: 3, n: 2 });

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const S = 400; const img = ctx.createImageData(S, S);
    const M = Math.round(m), N = Math.round(n);
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
      const x = px / S, y = py / S;
      const val = Math.cos(N * Math.PI * x) * Math.cos(M * Math.PI * y) - Math.cos(M * Math.PI * x) * Math.cos(N * Math.PI * y);
      const nodal = Math.abs(val); const t = Math.max(0, 1 - nodal * 8); // sand collects where val≈0
      const idx = (py * S + px) * 4; const c = 11 + t * 230; img.data[idx] = c; img.data[idx + 1] = c * 0.95 + t * 10; img.data[idx + 2] = c * 0.8; img.data[idx + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    ctx.strokeStyle = "#334155"; ctx.strokeRect(0, 0, S, S);
    ctx.fillStyle = "#22d3ee"; ctx.font = "13px sans-serif"; ctx.fillText(`mode (${N}, ${M}) — sand gathers on the nodal lines`, 10, S - 12);
  }, [m, n]);

  const M = Math.round(m), N = Math.round(n);
  const explain =
    M === N
      ? `With m=n=${M} the two plate modes cancel exactly everywhere, so the whole plate goes nodal — distinct mode numbers are what create a visible figure.`
      : (M + N) % 2 === 0
      ? `Modes (${N}, ${M}) sum to an even number, giving a pattern symmetric under a 90° rotation; larger mode numbers pack in more nodal lines and finer detail.`
      : `Modes (${N}, ${M}) sum to an odd number, breaking the diagonal symmetry so the sand figure differs across the two diagonals.`;

  const code = `import numpy as np
import matplotlib.pyplot as plt
m, n, S = ${M}, ${N}, 400
x = np.linspace(0, 1, S); X, Y = np.meshgrid(x, x)
val = np.cos(n*np.pi*X)*np.cos(m*np.pi*Y) - np.cos(m*np.pi*X)*np.cos(n*np.pi*Y)
plt.imshow(np.abs(val) < 0.02, cmap="hot"); plt.axis("off"); plt.show()`;

  return (
    <StudioChrome title="Chladni Plate Patterns" tagline="visible standing waves"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Mode m" value={m} min={1} max={7} step={1} onChange={(v) => update({ m: v })} />
        <Slider label="Mode n" value={n} min={1} max={7} step={1} onChange={(v) => update({ n: v })} />
        <p className="mt-3 text-xs text-slate-500">Bow or drive a metal plate at a resonant frequency and sand sprinkled on top dances away from the moving areas and settles along the still nodal lines — Chladni figures. Each pair of mode numbers gives a different symmetric pattern, a direct, physical picture of a two-dimensional standing wave.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Mode" value={`(${Math.round(n)}, ${Math.round(m)})`} /><Stat label="Symmetry" value={(Math.round(m) + Math.round(n)) % 2 === 0 ? "even" : "odd"} /><Stat label="Pattern" value="nodal lines" /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={400} height={400} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
