"use client";

import { useEffect, useRef, useState } from "react";
import { FluidField, DEFAULT_FLUID } from "@/lib/engines/fluid";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { Equation } from "./Equation";
import { useShareableNumbers } from "@/lib/studioKit";

const N = DEFAULT_FLUID.n;
const SCALE = 5;
const PX = (N + 2) * SCALE;

const PRESETS: Record<string, { viscosity: number; force: number; dye: number }> = {
  "Thin & wild": { viscosity: 0, force: 18, dye: 200 },
  "Thick & syrupy": { viscosity: 20e-7, force: 8, dye: 180 },
  "Ink drop": { viscosity: 2e-7, force: 4, dye: 300 },
  "Wispy smoke": { viscosity: 5e-7, force: 12, dye: 60 },
};

export function FluidStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<FluidField | null>(null);
  const imgRef = useRef<ImageData | null>(null);
  const frameRef = useRef(0);
  const pointer = useRef<{ x: number; y: number; px: number; py: number; down: boolean }>({
    x: 0, y: 0, px: 0, py: 0, down: false,
  });

  const [{ viscosity, force, dye }, update] = useShareableNumbers({ viscosity: 0.0000001, force: 6, dye: 120 });
  const forceRef = useRef(force); forceRef.current = force;
  const dyeRef = useRef(dye); dyeRef.current = dye;
  const [metrics, setMetrics] = useState({ totalDensity: 0, meanSpeed: 0, maxSpeed: 0, enstrophy: 0 });

  useEffect(() => {
    fieldRef.current = new FluidField({ ...DEFAULT_FLUID });
  }, []);

  useEffect(() => {
    if (fieldRef.current) fieldRef.current.cfg.visc = viscosity;
  }, [viscosity]);

  // Pointer stirring — inject dye and velocity where the user drags.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const toGrid = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const gx = Math.floor(((clientX - rect.left) / rect.width) * (N + 2));
      const gy = Math.floor(((clientY - rect.top) / rect.height) * (N + 2));
      return { gx, gy };
    };
    const onMove = (e: PointerEvent) => {
      const { gx, gy } = toGrid(e.clientX, e.clientY);
      pointer.current.px = pointer.current.x;
      pointer.current.py = pointer.current.y;
      pointer.current.x = gx;
      pointer.current.y = gy;
    };
    const onDown = (e: PointerEvent) => {
      pointer.current.down = true;
      const { gx, gy } = toGrid(e.clientX, e.clientY);
      pointer.current.x = gx; pointer.current.y = gy;
      pointer.current.px = gx; pointer.current.py = gy;
    };
    const onUp = () => (pointer.current.down = false);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const f = fieldRef.current;
    if (!f) return;
    const ctx = canvas.getContext("2d")!;
    if (!imgRef.current) imgRef.current = ctx.createImageData(PX, PX);
    const img = imgRef.current;
    const p = pointer.current;
    for (let s = 0; s < steps; s++) {
      if (p.down) {
        const amtX = (p.x - p.px) * forceRef.current;
        const amtY = (p.y - p.py) * forceRef.current;
        f.addVelocity(p.x, p.y, amtX, amtY);
        f.addDensity(p.x, p.y, dyeRef.current);
      } else {
        // gentle continuous plume from the bottom-center so it's alive on load
        const cx = Math.floor((N + 2) / 2);
        f.addDensity(cx, N - 2, dyeRef.current * 0.35);
        f.addVelocity(cx, N - 2, Math.sin(frameRef.current * 0.05) * forceRef.current * 0.6, -forceRef.current * 0.9);
      }
      f.step();
      frameRef.current++;
    }

    // render density to image
    for (let y = 0; y < N + 2; y++) {
      for (let x = 0; x < N + 2; x++) {
        const d = Math.min(255, f.density[x + y * (N + 2)] * 255);
        for (let sy = 0; sy < SCALE; sy++) {
          for (let sx = 0; sx < SCALE; sx++) {
            const px = (y * SCALE + sy) * PX + (x * SCALE + sx);
            const i = px * 4;
            img.data[i] = d * 0.15;
            img.data[i + 1] = d * 0.75;
            img.data[i + 2] = d;
            img.data[i + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    if (frameRef.current % 12 === 0) setMetrics(f.metrics());
  };

  const t = useTransport(frame);

  const explain =
    viscosity * 1e7 < 2
      ? "Near-zero viscosity: momentum barely dissipates, so vortices persist and the flow tips into turbulent, chaotic mixing."
      : viscosity * 1e7 > 12
      ? "High viscosity: internal friction damps the field fast — swirls decay into a slow, laminar drift."
      : force > 14
      ? "Strong injection force: each stroke drives fast jets that roll up into distinct, long-lived vortex pairs."
      : "Moderate viscosity: dye plumes billow and mix, with eddies that linger a while before diffusing away.";

  const code = `import numpy as np
# 2D stable-fluids (Stam) config
viscosity, force, dye = ${viscosity}, ${force}, ${dye}
N, dt = ${N}, 0.1
# per-step diffusion strength for the velocity field (Gauss-Seidel relaxation):
a = dt * viscosity * N * N
print("diffusion coefficient a =", a)`;

  return (
    <StudioChrome
      title="2D Fluid (CFD) Studio"
      tagline="Stam stable-fluids · Navier–Stokes"
      controls={
        <div>
          <TransportBar
            playing={t.playing}
            onToggle={t.toggle}
            onStep={t.step}
            onReset={() => { fieldRef.current = new FluidField({ ...DEFAULT_FLUID, visc: viscosity }); t.step(); }}
            speed={t.speed}
            onSpeed={t.setSpeed}
          />
          <p className="mb-3 text-xs text-slate-500">Click and drag on the canvas to inject dye and velocity.</p>
          <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
          <Slider label="Viscosity" value={viscosity * 1e7} min={0} max={20} step={0.5} onChange={(v) => update({ viscosity: v / 1e7 })} />
          <Slider label="Injection force" value={force} min={1} max={20} step={1} onChange={(v) => update({ force: v })} />
          <Slider label="Dye amount" value={dye} min={20} max={300} step={10} onChange={(v) => update({ dye: v })} />
          <ShareBar code={code} />
        </div>
      }
      inspector={
        <div>
          <Stat label="Grid" value={`${N}×${N}`} />
          <Stat label="Total dye" value={metrics.totalDensity.toFixed(0)} />
          <Stat label="Mean speed" value={metrics.meanSpeed.toFixed(3)} />
          <Stat label="Max speed" value={metrics.maxSpeed.toFixed(3)} />
          <Stat label="Enstrophy" value={metrics.enstrophy.toExponential(2)} />
          <Equation tex={`\\frac{\\partial \\mathbf{u}}{\\partial t} + (\\mathbf{u}\\cdot\\nabla)\\mathbf{u} = -\\frac{\\nabla p}{\\rho} + ${viscosity.toExponential(1)}\\,\\nabla^2\\mathbf{u},\\quad \\nabla\\cdot\\mathbf{u} = 0`} />
          <ExplainResult text={explain} />
        </div>
      }
    >
      <canvas ref={canvasRef} width={PX} height={PX} className="mx-auto h-auto max-h-[440px] w-auto max-w-full rounded-lg" style={{ imageRendering: "auto" }} />
    </StudioChrome>
  );
}
