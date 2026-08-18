"use client";

import { useEffect, useRef } from "react";
import { Fluid3D } from "@/lib/engines/fluid3d";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";
import { Equation } from "./Equation";

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
  const frameRef = useRef(0);
  const [{ zslice, force }, update] = useShareableNumbers({ zslice: Math.floor(N / 2), force: 30 });
  const zsliceRef = useRef(zslice); zsliceRef.current = zslice;
  const forceRef = useRef(force); forceRef.current = force;

  useEffect(() => { fRef.current = new Fluid3D(N); }, []);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const f = fRef.current;
    if (!f) return;
    const ctx = hidpi(canvas, CW, CH);
    const s = N + 2;
    const c = Math.floor(s / 2);
    const fc = forceRef.current;
    const zs = zsliceRef.current;
    for (let st = 0; st < steps; st++) {
      // continuous rising plume at the bottom-center
      f.addDensity(c, 2, Math.floor(s / 2), 40);
      f.addVelocity(c, 2, Math.floor(s / 2), Math.sin(frameRef.current * 0.05) * fc * 0.4, fc, Math.cos(frameRef.current * 0.05) * fc * 0.4);
      f.step();
      frameRef.current++;
    }
    const img = ctx.createImageData(s, s);
    const sl = f.slice(zs);
    for (let i = 0; i < s * s; i++) { const d = Math.min(255, sl[i] * 255); img.data[i * 4] = d * 0.2; img.data[i * 4 + 1] = d * 0.75; img.data[i * 4 + 2] = d; img.data[i * 4 + 3] = 255; }
    const tmp = document.createElement("canvas"); tmp.width = s; tmp.height = s; tmp.getContext("2d")!.putImageData(img, 0, 0);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, CW, CH);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(tmp, (CW - 440) / 2, 20, 440, 440);
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`z-slice ${zs}/${N} — rising 3D plume`, 16, CH - 12);
  };

  const t = useTransport(frame);

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
          <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { fRef.current = new Fluid3D(N); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
          <p className="mb-3 text-xs text-slate-500">A dye plume rises through a full 3D incompressible flow. Scrub the z-slice to inspect the volume.</p>
          <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
          <Slider label="z-slice" value={zslice} min={1} max={N} step={1} onChange={(v) => update({ zslice: v })} />
          <Slider label="Plume force" value={force} min={5} max={60} step={5} onChange={(v) => update({ force: v })} />
          <ShareBar code={code} />
        </div>
      }
      inspector={<div><Stat label="Grid" value={`${N}³`} /><Stat label="Cells" value={((N + 2) ** 3).toLocaleString()} /><Stat label="Scheme" value="Stam Stable Fluids" /><Stat label="Incompressible" value="Jacobi projection" /><Equation tex={`\\frac{\\partial \\mathbf{u}}{\\partial t}+(\\mathbf{u}\\cdot\\nabla)\\mathbf{u}=-\\frac{\\nabla p}{\\rho}+\\nu\\nabla^2\\mathbf{u}+\\mathbf{f},\\quad \\nabla\\cdot\\mathbf{u}=0,\\ \\ |\\mathbf{f}|=${force}`} /><ExplainResult text={explain} /></div>}
    >
      <canvas ref={canvasRef} width={760} height={480} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
