"use client";

import { useEffect, useRef, useState } from "react";
import { Fluid3D } from "@/lib/engines/fluid3d";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const N = 24;
const CW = 760, CH = 480;

const PRESETS: Record<string, { zslice: number; force: number }> = {
  "Gentle plume": { zslice: 12, force: 10 },
  "Vigorous jet": { zslice: 12, force: 60 },
  "Front slice": { zslice: 6, force: 30 },
  "Back slice": { zslice: 18, force: 30 },
};

export function CFD3DStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fRef = useRef<Fluid3D | null>(null);
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [{ zslice, force }, update] = useShareableNumbers({ zslice: Math.floor(N / 2), force: 30 });

  useEffect(() => { fRef.current = new Fluid3D(N); }, []);

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = hidpi(canvas, CW, CH);
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
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, CW, CH);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(tmp, (CW - 440) / 2, 20, 440, 440);
      ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`z-slice ${zslice}/${N} — rising 3D plume`, 16, CH - 12);
      frame++;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, zslice, force]);

  const explain =
    force >= 45
      ? `A strong plume force (${force}) drives fast vertical advection, so the dye punches high and rolls into turbulent eddies that mix it sideways before diffusion can smooth it.`
      : force <= 15
      ? `A gentle plume force (${force}) lets buoyancy and diffusion compete evenly, so the dye rises slowly as a smooth, nearly laminar column.`
      : `At moderate force (${force}) the incompressible constraint is visible: each step the projection removes divergence, so fluid pushed up the center must fold back down along the sides.`;

  const code = `import numpy as np
N, force, zslice = ${N}, ${force}, ${zslice}
# Stam Stable Fluids on an (N+2)^3 grid, Jacobi projection each step
s = N + 2; c = s // 2
# per frame: inject dye + upward velocity at the bottom-center cell
#   add_density(c, 2, c, 40)
#   add_velocity(c, 2, c, ~0, force, ~0); then fluid.step()
# visualize the z = zslice plane of the density field
print("grid", f"{N}^3", "cells", (N + 2) ** 3, "plume force", force)`;

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
          <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
          <Slider label="z-slice" value={zslice} min={1} max={N} step={1} onChange={(v) => update({ zslice: v })} />
          <Slider label="Plume force" value={force} min={5} max={60} step={5} onChange={(v) => update({ force: v })} />
          <ShareBar code={code} />
        </div>
      }
      inspector={<div><Stat label="Grid" value={`${N}³`} /><Stat label="Cells" value={((N + 2) ** 3).toLocaleString()} /><Stat label="Scheme" value="Stam Stable Fluids" /><Stat label="Incompressible" value="Jacobi projection" /><ExplainResult text={explain} /></div>}
    >
      <canvas ref={canvasRef} width={760} height={480} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
