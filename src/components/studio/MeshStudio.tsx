"use client";

import { useEffect, useRef, useState } from "react";
import { MeshDomain, meshInit, meshPaint, meshSolve } from "@/lib/engines/mesh";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { brush: number }> = {
  "Fine (1)": { brush: 1 },
  "Medium (4)": { brush: 4 },
  "Broad (8)": { brush: 8 },
  "Flood (12)": { brush: 12 },
};

export function MeshStudio() {
  const N = 100;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const domRef = useRef<MeshDomain | null>(null);
  const rafRef = useRef(0);
  const painting = useRef(false);
  const [tool, setTool] = useState<"hot" | "cold" | "wall" | "clear">("hot");
  const [{ brush }, update] = useShareableNumbers({ brush: 4 });
  const [res, setRes] = useState(0);

  useEffect(() => { domRef.current = meshInit(N); }, []);

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(N, N);
    const paintAt = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = Math.floor(((e.clientX - r.left) / r.width) * N), y = Math.floor(((e.clientY - r.top) / r.height) * N);
      meshPaint(domRef.current!, x, y, brush, tool);
    };
    const onDown = (e: PointerEvent) => { painting.current = true; paintAt(e); };
    const onMove = (e: PointerEvent) => { if (painting.current) paintAt(e); };
    const onUp = () => (painting.current = false);
    canvas.addEventListener("pointerdown", onDown); canvas.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);

    let frame = 0;
    const loop = () => {
      const d = domRef.current!; const r = meshSolve(d, 4);
      for (let i = 0; i < N * N; i++) {
        if (d.wall[i]) { img.data[i * 4] = 60; img.data[i * 4 + 1] = 60; img.data[i * 4 + 2] = 70; img.data[i * 4 + 3] = 255; continue; }
        const t = Math.min(1, Math.max(0, d.temp[i]));
        img.data[i * 4] = t * 255 * (t > 0.5 ? 1 : 0.3); img.data[i * 4 + 1] = t * 200; img.data[i * 4 + 2] = (1 - t) * 220 + 20; img.data[i * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      if (frame++ % 10 === 0) setRes(r);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); canvas.removeEventListener("pointerdown", onDown); canvas.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [tool, brush]);

  const explain =
    brush >= 9
      ? `A broad brush stamps large fixed-temperature regions, so the Laplace solution is dominated by those plateaus and relaxes with gentle gradients.`
      : brush <= 2
      ? `A fine brush sets pinpoint sources — steep local gradients form, and Gauss-Seidel needs more sweeps to smooth them into steady state.`
      : `At steady state ∇²u=0 means every interior cell equals the average of its four neighbors, so heat spreads smoothly between the fixed hot and cold edges.`;

  const code = `import numpy as np
# steady heat: Laplace via Gauss-Seidel relaxation on an N x N grid
N, brush = ${N}, ${brush}
u = np.zeros((N, N)); u[:, 0] = 1.0          # hot left edge, cold right
for _ in range(500):
    u[1:-1, 1:-1] = 0.25*(u[:-2, 1:-1] + u[2:, 1:-1] + u[1:-1, :-2] + u[1:-1, 2:])
print("mean temperature", u.mean())`;

  return (
    <StudioChrome
      title="Meshing + BC Editor — Steady Heat"
      tagline="Laplace ∇²u=0 · Gauss-Seidel relaxation"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">Paint boundary conditions on the domain and watch it relax to steady state. Left edge is hot, right is cold by default.</p>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {(["hot", "cold", "wall", "clear"] as const).map((t) => (
              <button key={t} onClick={() => setTool(t)} className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${tool === t ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{t}</button>
            ))}
          </div>
          <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
          <Slider label="Brush size" value={brush} min={1} max={12} step={1} onChange={(v) => update({ brush: v })} />
          <button onClick={() => (domRef.current = meshInit(N))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Reset domain</button>
          <ShareBar code={code} />
        </div>
      }
      inspector={<div><Stat label="Grid" value={`${N}×${N}`} /><Stat label="Solver" value="Gauss-Seidel" /><Stat label="Residual" value={res.toExponential(2)} /><Stat label="Status" value={res < 1e-4 ? "steady" : "relaxing"} /><Equation tex={`\\nabla^2 u=0\\ \\Rightarrow\\ u_{i,j}=\\tfrac{1}{4}\\left(u_{i-1,j}+u_{i+1,j}+u_{i,j-1}+u_{i,j+1}\\right),\\quad ${N}\\times${N}\\text{ grid},\\ r=${res.toExponential(2)}`} /><ExplainResult text={explain} /></div>}
    >
      <canvas ref={canvasRef} width={N} height={N} className="mx-auto h-auto max-h-[440px] cursor-crosshair rounded-lg" style={{ imageRendering: "pixelated", width: "440px" }} />
    </StudioChrome>
  );
}
