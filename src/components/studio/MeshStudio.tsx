"use client";

import { useEffect, useRef, useState } from "react";
import { MeshDomain, meshInit, meshPaint, meshSolve } from "@/lib/engines/mesh";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function MeshStudio() {
  const N = 100;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const domRef = useRef<MeshDomain | null>(null);
  const rafRef = useRef(0);
  const painting = useRef(false);
  const [tool, setTool] = useState<"hot" | "cold" | "wall" | "clear">("hot");
  const [brush, setBrush] = useState(4);
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
          <Slider label="Brush size" value={brush} min={1} max={12} step={1} onChange={setBrush} />
          <button onClick={() => (domRef.current = meshInit(N))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Reset domain</button>
        </div>
      }
      inspector={<div><Stat label="Grid" value={`${N}×${N}`} /><Stat label="Solver" value="Gauss-Seidel" /><Stat label="Residual" value={res.toExponential(2)} /><Stat label="Status" value={res < 1e-4 ? "steady" : "relaxing"} /></div>}
    >
      <canvas ref={canvasRef} width={N} height={N} className="mx-auto h-auto max-h-[440px] cursor-crosshair rounded-lg" style={{ imageRendering: "pixelated", width: "440px" }} />
    </StudioChrome>
  );
}
