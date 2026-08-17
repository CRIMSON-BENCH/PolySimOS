"use client";

import { useEffect, useRef, useState } from "react";
import { Fluid3D } from "@/lib/engines/fluid3d";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const N = 24;

export function CFD3DStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fRef = useRef<Fluid3D | null>(null);
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [zslice, setZslice] = useState(Math.floor(N / 2));
  const [force, setForce] = useState(30);

  useEffect(() => { fRef.current = new Fluid3D(N); }, []);

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!;
    const s = N + 2;
    const img = ctx.createImageData(s, s);
    let frame = 0;
    const loop = () => {
      const f = fRef.current!;
      // continuous rising plume at the bottom-center
      const c = Math.floor(s / 2);
      f.addDensity(c, 2, Math.floor(s / 2), 40);
      f.addVelocity(c, 2, Math.floor(s / 2), Math.sin(frame * 0.05) * force * 0.4, force, Math.cos(frame * 0.05) * force * 0.4);
      if (running) f.step();
      const sl = f.slice(zslice);
      for (let i = 0; i < s * s; i++) { const d = Math.min(255, sl[i] * 255); img.data[i * 4] = d * 0.2; img.data[i * 4 + 1] = d * 0.75; img.data[i * 4 + 2] = d; img.data[i * 4 + 3] = 255; }
      const tmp = document.createElement("canvas"); tmp.width = s; tmp.height = s; tmp.getContext("2d")!.putImageData(img, 0, 0);
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(tmp, (canvas.width - 440) / 2, 20, 440, 440);
      ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`z-slice ${zslice}/${N} — rising 3D plume`, 16, canvas.height - 12);
      frame++;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, zslice, force]);

  return (
    <StudioChrome
      title="3D CFD Studio"
      tagline="3D Stable Fluids · Navier–Stokes"
      controls={
        <div>
          <div className="mb-3 flex gap-2">
            <button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button>
            <button onClick={() => (fRef.current = new Fluid3D(N))} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Clear</button>
          </div>
          <p className="mb-3 text-xs text-slate-500">A dye plume rises through a full 3D incompressible flow. Scrub the z-slice to inspect the volume.</p>
          <Slider label="z-slice" value={zslice} min={1} max={N} step={1} onChange={setZslice} />
          <Slider label="Plume force" value={force} min={5} max={60} step={5} onChange={setForce} />
        </div>
      }
      inspector={<div><Stat label="Grid" value={`${N}³`} /><Stat label="Cells" value={((N + 2) ** 3).toLocaleString()} /><Stat label="Scheme" value="Stam Stable Fluids" /><Stat label="Incompressible" value="Jacobi projection" /></div>}
    >
      <canvas ref={canvasRef} width={760} height={480} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
