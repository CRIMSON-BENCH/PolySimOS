"use client";

import { useEffect, useRef, useState } from "react";
import { Heat3D, heat3dInit, heat3dStep, heat3dSlice, heat3dHotVoxels } from "@/lib/engines/heat3d";
import { project } from "@/lib/engines/threeD";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const N = 40, W = 760, H = 480;

export function Heat3DStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fRef = useRef<Heat3D | null>(null);
  const rafRef = useRef(0);
  const cam = useRef({ yaw: 0.7, pitch: -0.35 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [running, setRunning] = useState(true);
  const [alpha, setAlpha] = useState(0.12);
  const [zslice, setZslice] = useState(20);
  const [mode, setMode] = useState<"volume" | "slice">("volume");

  useEffect(() => { fRef.current = heat3dInit(N); }, []);

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!;
    const onDown = (e: PointerEvent) => (drag.current = { x: e.clientX, y: e.clientY });
    const onMove = (e: PointerEvent) => { if (!drag.current) return; cam.current.yaw += (e.clientX - drag.current.x) * 0.01; cam.current.pitch = Math.max(-1.3, Math.min(1.3, cam.current.pitch + (e.clientY - drag.current.y) * 0.01)); drag.current = { x: e.clientX, y: e.clientY }; };
    const onUp = () => (drag.current = null);
    canvas.addEventListener("pointerdown", onDown); window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
    const sliceImg = ctx.createImageData(N, N);

    const loop = () => {
      const f = fRef.current!; if (running) heat3dStep(f, alpha, 1);
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      if (mode === "slice") {
        const s = heat3dSlice(f, zslice);
        for (let i = 0; i < N * N; i++) { const t = Math.min(1, s[i]); sliceImg.data[i * 4] = t * 255; sliceImg.data[i * 4 + 1] = t * 180; sliceImg.data[i * 4 + 2] = (1 - t) * 220 + 20; sliceImg.data[i * 4 + 3] = 255; }
        // scale up the slice into the canvas
        const tmp = document.createElement("canvas"); tmp.width = N; tmp.height = N; tmp.getContext("2d")!.putImageData(sliceImg, 0, 0);
        ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp, W / 2 - 220, H / 2 - 220, 440, 440);
        ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`z-slice ${Math.round(zslice)}/${N}`, 16, H - 16);
      } else {
        const voxels = heat3dHotVoxels(f, 0.08).sort((a, b) => {
          const pa = project(a, cam.current.yaw, cam.current.pitch, 90, W, H), pb = project(b, cam.current.yaw, cam.current.pitch, 90, W, H);
          return pb.depth - pa.depth;
        });
        for (const v of voxels) { const p = project(v, cam.current.yaw, cam.current.pitch, 90, W, H); if (p.depth <= 1) continue; const t = Math.min(1, v.t); ctx.fillStyle = `rgba(${255 * t | 0},${180 * t | 0},${40 + (1 - t) * 180 | 0},${0.15 + t * 0.6})`; ctx.fillRect(p.sx2, p.sy2, Math.max(2, 6 * p.scale), Math.max(2, 6 * p.scale)); }
        ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("drag to orbit · hot-voxel projection", 16, H - 16);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); canvas.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [running, alpha, zslice, mode]);

  return (
    <StudioChrome
      title="3D Heat Diffusion Studio"
      tagline="3D finite difference · ∂u/∂t = α∇³u"
      controls={
        <div>
          <div className="mb-3 flex gap-2">
            <button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button>
            <button onClick={() => (fRef.current = heat3dInit(N))} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Reset</button>
          </div>
          <div className="mb-3 flex gap-2">
            {(["volume", "slice"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold capitalize ${mode === m ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{m}</button>)}
          </div>
          <Slider label="Diffusivity α" value={alpha} min={0.02} max={0.16} step={0.01} onChange={setAlpha} />
          {mode === "slice" && <Slider label="z-slice" value={zslice} min={0} max={N - 1} step={1} onChange={setZslice} />}
        </div>
      }
      inspector={<div><Stat label="Grid" value={`${N}³`} /><Stat label="Cells" value={(N * N * N).toLocaleString()} /><Stat label="Scheme" value="Explicit FD" /></div>}
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full cursor-grab rounded-lg" />
    </StudioChrome>
  );
}
