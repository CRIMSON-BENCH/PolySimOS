"use client";

import { useEffect, useRef, useState } from "react";
import { heatInit, heatStep, heatHotspot, HeatField, waveInit, waveStep, WaveField } from "@/lib/engines/fields";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const HEAT_PRESETS: Record<string, { alpha: number }> = {
  "Slow diffusion": { alpha: 0.05 },
  "Balanced": { alpha: 0.15 },
  "Fast spread": { alpha: 0.20 },
  "Max stable": { alpha: 0.24 },
};

const WAVE_PRESETS: Record<string, { speed: number }> = {
  "Slow ripple": { speed: 0.14 },
  "Moderate": { speed: 0.36 },
  "Fast": { speed: 0.54 },
  "Near CFL limit": { speed: 0.70 },
};

export function FieldStudio() {
  const [mode, setMode] = useState<"heat" | "wave">("heat");
  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["heat", "wave"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${mode === m ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>
            {m === "heat" ? "2D Heat Equation" : "1D Wave Equation"}
          </button>
        ))}
      </div>
      {mode === "heat" ? <Heat /> : <Wave />}
    </div>
  );
}

function Heat() {
  const N = 120;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<HeatField | null>(null);
  const [{ alpha }, update] = useShareableNumbers({ alpha: 0.2 });
  const alphaRef = useRef(alpha); alphaRef.current = alpha;

  useEffect(() => { fieldRef.current = heatInit(N); }, []);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const f = fieldRef.current;
    if (!f) return;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(N, N);
    heatStep(f, alphaRef.current, 2 * steps);
    for (let i = 0; i < N * N; i++) {
      const v = Math.min(1, Math.max(0, f.u[i]));
      // blue(cold) -> cyan -> lime -> yellow(hot)
      img.data[i * 4] = v * 255 * (v > 0.5 ? 1 : 0.3);
      img.data[i * 4 + 1] = v * 255;
      img.data[i * 4 + 2] = (1 - v) * 200 + 30;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  };

  const t = useTransport(frame);

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * N);
    const y = Math.floor(((e.clientY - r.top) / r.height) * N);
    heatHotspot(fieldRef.current!, x, y, 6);
  };

  const explain =
    alpha >= 0.22
      ? `Diffusivity α = ${alpha.toFixed(2)} sits right at the 0.25 stability ceiling for this explicit scheme: heat blurs outward in just a few steps, but nudge α higher and the finite-difference update would oscillate and blow up.`
      : alpha <= 0.08
      ? `Small diffusivity α = ${alpha.toFixed(2)}: heat creeps outward slowly and the explicit scheme is rock-solid, but sharp hotspots stay visible for many frames.`
      : `Diffusivity α = ${alpha.toFixed(2)} spreads heat at a moderate rate while staying well under the 0.25 explicit-stability limit — hotspots smooth into a gentle gradient within a second or two.`;

  const code = `import numpy as np
alpha, N, steps = ${alpha}, ${N}, 2
u = np.zeros((N, N)); u[N // 2, N // 2] = 1.0
for _ in range(steps):
    lap = (np.roll(u, 1, 0) + np.roll(u, -1, 0)
           + np.roll(u, 1, 1) + np.roll(u, -1, 1) - 4 * u)
    u += alpha * lap
print("stable" if alpha <= 0.25 else "unstable", "peak", round(u.max(), 4))`;

  return (
    <StudioChrome
      title="Field — 2D Heat Equation"
      tagline="explicit finite difference · ∂u/∂t = α∇²u"
      controls={
        <div>
          <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { fieldRef.current = heatInit(N); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
          <p className="mb-3 text-xs text-slate-500">Click the field to add heat.</p>
          <Presets
            presets={Object.keys(HEAT_PRESETS).map((label) => ({ label }))}
            onApply={(label) => update(HEAT_PRESETS[label])}
          />
          <Slider label="Diffusivity α" value={alpha} min={0.05} max={0.24} step={0.01} onChange={(v) => update({ alpha: v })} />
          <ShareBar code={code} />
        </div>
      }
      inspector={<div><Stat label="Grid" value={`${N}×${N}`} /><Stat label="Scheme" value="Explicit FD" /><Stat label="Stability" value={alpha <= 0.25 ? "stable" : "risky"} /><Equation tex={`\\frac{\\partial u}{\\partial t} = ${alpha.toFixed(2)}\\,\\nabla^2 u`} /><ExplainResult text={explain} /></div>}
    >
      <canvas ref={canvasRef} width={N} height={N} onClick={onClick} className="mx-auto h-auto max-h-[440px] cursor-crosshair rounded-lg" style={{ imageRendering: "pixelated", width: "440px" }} />
    </StudioChrome>
  );
}

function Wave() {
  const N = 400;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<WaveField | null>(null);
  const [{ speed }, update] = useShareableNumbers({ speed: 0.5 });
  const speedRef = useRef(speed); speedRef.current = speed;
  const W = 760, H = 360;

  useEffect(() => { fieldRef.current = waveInit(N); }, []);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const f = fieldRef.current;
    if (!f) return;
    const ctx = hidpi(canvas, W, H);
    waveStep(f, speedRef.current, 0.9995, 2 * steps);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 0; x < N; x++) {
      const px = (x / (N - 1)) * W;
      const py = H / 2 - f.u[x] * (H / 2 - 20);
      x === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
  };

  const t = useTransport(frame);

  const pluck = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * N);
    const f = fieldRef.current!;
    for (let d = -12; d <= 12; d++) { const i = x + d; if (i > 0 && i < N - 1) { const v = Math.exp(-(d * d) / 40); f.u[i] += v; f.uPrev[i] += v; } }
  };

  const explain =
    speed >= 0.6
      ? `Wave speed c = ${speed.toFixed(2)} runs the pulse nearly a full grid cell per step — close to the CFL limit where this explicit scheme stops being stable. Reflections race back and forth fast.`
      : speed <= 0.2
      ? `Low wave speed c = ${speed.toFixed(2)}: the pluck crawls along the string, so the scheme is very stable but you wait longer to watch it reflect off the ends.`
      : `Wave speed c = ${speed.toFixed(2)} keeps the pulse comfortably inside the CFL stability window — reflections bounce off both fixed ends and interfere to form standing-wave patterns.`;

  const code = `import numpy as np
c, N = ${speed}, ${N}
u = np.zeros(N); u_prev = np.zeros(N); u[N // 2] = 1.0
for _ in range(2):
    lap = np.roll(u, 1) + np.roll(u, -1) - 2 * u
    u_next = 2 * u - u_prev + c * c * lap
    u_next[0] = u_next[-1] = 0.0  # fixed ends
    u_prev, u = u, u_next
print("CFL", "ok" if c <= 1 else "risky")`;

  return (
    <StudioChrome
      title="Field — 1D Wave Equation"
      tagline="explicit FD · ∂²u/∂t² = c²∂²u/∂x²"
      controls={
        <div>
          <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { fieldRef.current = waveInit(N); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
          <p className="mb-3 text-xs text-slate-500">Click the string to pluck it.</p>
          <Presets
            presets={Object.keys(WAVE_PRESETS).map((label) => ({ label }))}
            onApply={(label) => update(WAVE_PRESETS[label])}
          />
          <Slider label="Wave speed c" value={speed} min={0.1} max={0.7} step={0.02} onChange={(v) => update({ speed: v })} />
          <ShareBar code={code} />
        </div>
      }
      inspector={<div><Stat label="Points" value={String(N)} /><Stat label="Scheme" value="Explicit FD" /><Stat label="CFL" value={speed <= 0.7 ? "ok" : "risky"} /><Equation tex={`\\frac{\\partial^2 u}{\\partial t^2} = (${speed.toFixed(2)})^2\\,\\frac{\\partial^2 u}{\\partial x^2}`} /><ExplainResult text={explain} /></div>}
    >
      <canvas ref={canvasRef} width={W} height={H} onClick={pluck} className="h-auto w-full cursor-crosshair rounded-lg" />
    </StudioChrome>
  );
}
