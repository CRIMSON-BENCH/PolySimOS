"use client";

import { useEffect, useRef, useState } from "react";
import { Heat3D, heat3dInit, heat3dStep, heat3dSlice, heat3dHotVoxels } from "@/lib/engines/heat3d";
import { project } from "@/lib/engines/threeD";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const N = 40, W = 760, H = 480;

const PRESETS: Record<string, { alpha: number; zslice: number }> = {
  "Slow diffusion": { alpha: 0.03, zslice: 20 },
  "Fast diffusion": { alpha: 0.15, zslice: 20 },
  "Bottom slice": { alpha: 0.1, zslice: 5 },
  "Top slice": { alpha: 0.1, zslice: 35 },
};

export function Heat3DStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fRef = useRef<Heat3D | null>(null);
  const cam = useRef({ yaw: 0.7, pitch: -0.35 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [{ alpha, zslice }, update] = useShareableNumbers({ alpha: 0.12, zslice: 20 });
  const [mode, setMode] = useState<"volume" | "slice">("volume");
  const alphaRef = useRef(alpha); alphaRef.current = alpha;
  const zsliceRef = useRef(zslice); zsliceRef.current = zslice;
  const modeRef = useRef(mode); modeRef.current = mode;

  useEffect(() => { fRef.current = heat3dInit(N); }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const onDown = (e: PointerEvent) => (drag.current = { x: e.clientX, y: e.clientY });
    const onMove = (e: PointerEvent) => { if (!drag.current) return; cam.current.yaw += (e.clientX - drag.current.x) * 0.01; cam.current.pitch = Math.max(-1.3, Math.min(1.3, cam.current.pitch + (e.clientY - drag.current.y) * 0.01)); drag.current = { x: e.clientX, y: e.clientY }; };
    const onUp = () => (drag.current = null);
    canvas.addEventListener("pointerdown", onDown); window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
    return () => { canvas.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, []);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const f = fRef.current;
    if (!f) return;
    const ctx = hidpi(canvas, W, H);
    heat3dStep(f, alphaRef.current, steps);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    if (modeRef.current === "slice") {
      const s = heat3dSlice(f, zsliceRef.current);
      const sliceImg = ctx.createImageData(N, N);
      for (let i = 0; i < N * N; i++) { const t = Math.min(1, s[i]); sliceImg.data[i * 4] = t * 255; sliceImg.data[i * 4 + 1] = t * 180; sliceImg.data[i * 4 + 2] = (1 - t) * 220 + 20; sliceImg.data[i * 4 + 3] = 255; }
      // scale up the slice into the canvas
      const tmp = document.createElement("canvas"); tmp.width = N; tmp.height = N; tmp.getContext("2d")!.putImageData(sliceImg, 0, 0);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp, W / 2 - 220, H / 2 - 220, 440, 440);
      ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`z-slice ${Math.round(zsliceRef.current)}/${N}`, 16, H - 16);
    } else {
      const voxels = heat3dHotVoxels(f, 0.08).sort((a, b) => {
        const pa = project(a, cam.current.yaw, cam.current.pitch, 90, W, H), pb = project(b, cam.current.yaw, cam.current.pitch, 90, W, H);
        return pb.depth - pa.depth;
      });
      for (const v of voxels) { const p = project(v, cam.current.yaw, cam.current.pitch, 90, W, H); if (p.depth <= 1) continue; const t = Math.min(1, v.t); ctx.fillStyle = `rgba(${255 * t | 0},${180 * t | 0},${40 + (1 - t) * 180 | 0},${0.15 + t * 0.6})`; ctx.fillRect(p.sx2, p.sy2, Math.max(2, 6 * p.scale), Math.max(2, 6 * p.scale)); }
      ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("drag to orbit · hot-voxel projection", 16, H - 16);
    }
  };

  const tr = useTransport(frame);

  const explain =
    alpha > 0.14
      ? "High diffusivity spreads heat fast, but an explicit finite-difference scheme goes unstable if the step is pushed much higher — the stability (CFL) limit is real."
      : mode === "slice"
      ? "The z-slice is a 2D cross-section of the 3D field — watch heat bleed in from neighboring slices as it diffuses through all three dimensions."
      : alpha < 0.05
      ? "Low diffusivity: heat lingers near its source and the hot core stays sharp for many steps."
      : "Heat spreads outward at a rate set by the diffusivity — each cell relaxes toward the average of its six neighbors every step.";

  const code = `import numpy as np
N, alpha = ${N}, ${alpha}
u = np.zeros((N, N, N)); u[N//2, N//2, N//2] = 1.0
lap = lambda f: (np.roll(f,1,0)+np.roll(f,-1,0)+np.roll(f,1,1)
                 +np.roll(f,-1,1)+np.roll(f,1,2)+np.roll(f,-1,2)-6*f)
for _ in range(50):
    u += alpha * lap(u)
print("peak", round(u.max(), 4))`;

  return (
    <StudioChrome
      title="3D Heat Diffusion Studio"
      tagline="3D finite difference · ∂u/∂t = α∇³u"
      controls={
        <div>
          <TransportBar playing={tr.playing} onToggle={tr.toggle} onStep={tr.step} onReset={() => { fRef.current = heat3dInit(N); tr.step(); }} speed={tr.speed} onSpeed={tr.setSpeed} />
          <div className="mb-3 flex gap-2">
            {(["volume", "slice"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold capitalize ${mode === m ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{m}</button>)}
          </div>
          <Presets
            presets={Object.keys(PRESETS).map((label) => ({ label }))}
            onApply={(label) => update(PRESETS[label])}
          />
          <Slider label="Diffusivity α" value={alpha} min={0.02} max={0.16} step={0.01} onChange={(v) => update({ alpha: v })} />
          {mode === "slice" && <Slider label="z-slice" value={zslice} min={0} max={N - 1} step={1} onChange={(v) => update({ zslice: v })} />}
          <ShareBar code={code} />
        </div>
      }
      inspector={<div><Stat label="Grid" value={`${N}³`} /><Stat label="Cells" value={(N * N * N).toLocaleString()} /><Stat label="Scheme" value="Explicit FD" /><Equation tex={`\\frac{\\partial u}{\\partial t} = ${alpha}\\,\\nabla^2 u = ${alpha}\\left(u_{xx} + u_{yy} + u_{zz}\\right)`} /><ExplainResult text={explain} /></div>}
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full cursor-grab rounded-lg" />
    </StudioChrome>
  );
}
