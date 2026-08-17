"use client";

import { useEffect, useRef, useState } from "react";
import { heatInit, heatStep, heatHotspot, HeatField, waveInit, waveStep, WaveField } from "@/lib/engines/fields";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

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
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [alpha, setAlpha] = useState(0.2);

  useEffect(() => { fieldRef.current = heatInit(N); }, []);
  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    const img = ctx.createImageData(N, N);
    const loop = () => {
      const f = fieldRef.current!;
      if (running) heatStep(f, alpha, 2);
      for (let i = 0; i < N * N; i++) {
        const v = Math.min(1, Math.max(0, f.u[i]));
        // blue(cold) -> cyan -> lime -> yellow(hot)
        img.data[i * 4] = v * 255 * (v > 0.5 ? 1 : 0.3);
        img.data[i * 4 + 1] = v * 255;
        img.data[i * 4 + 2] = (1 - v) * 200 + 30;
        img.data[i * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, alpha]);

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * N);
    const y = Math.floor(((e.clientY - r.top) / r.height) * N);
    heatHotspot(fieldRef.current!, x, y, 6);
  };

  return (
    <StudioChrome
      title="Field — 2D Heat Equation"
      tagline="explicit finite difference · ∂u/∂t = α∇²u"
      controls={
        <div>
          <div className="mb-3 flex gap-2">
            <button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button>
            <button onClick={() => (fieldRef.current = heatInit(N))} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Reset</button>
          </div>
          <p className="mb-3 text-xs text-slate-500">Click the field to add heat.</p>
          <Slider label="Diffusivity α" value={alpha} min={0.05} max={0.24} step={0.01} onChange={setAlpha} />
        </div>
      }
      inspector={<div><Stat label="Grid" value={`${N}×${N}`} /><Stat label="Scheme" value="Explicit FD" /><Stat label="Stability" value={alpha <= 0.25 ? "stable" : "risky"} /></div>}
    >
      <canvas ref={canvasRef} width={N} height={N} onClick={onClick} className="mx-auto h-auto max-h-[440px] cursor-crosshair rounded-lg" style={{ imageRendering: "pixelated", width: "440px" }} />
    </StudioChrome>
  );
}

function Wave() {
  const N = 400;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<WaveField | null>(null);
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(0.5);
  const W = 760, H = 360;

  useEffect(() => { fieldRef.current = waveInit(N); }, []);
  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    const loop = () => {
      const f = fieldRef.current!;
      if (running) waveStep(f, speed, 0.9995, 2);
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = 0; x < N; x++) {
        const px = (x / (N - 1)) * W;
        const py = H / 2 - f.u[x] * (H / 2 - 20);
        x === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, speed]);

  const pluck = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * N);
    const f = fieldRef.current!;
    for (let d = -12; d <= 12; d++) { const i = x + d; if (i > 0 && i < N - 1) { const v = Math.exp(-(d * d) / 40); f.u[i] += v; f.uPrev[i] += v; } }
  };

  return (
    <StudioChrome
      title="Field — 1D Wave Equation"
      tagline="explicit FD · ∂²u/∂t² = c²∂²u/∂x²"
      controls={
        <div>
          <div className="mb-3 flex gap-2">
            <button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button>
            <button onClick={() => (fieldRef.current = waveInit(N))} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Reset</button>
          </div>
          <p className="mb-3 text-xs text-slate-500">Click the string to pluck it.</p>
          <Slider label="Wave speed c" value={speed} min={0.1} max={0.7} step={0.02} onChange={setSpeed} />
        </div>
      }
      inspector={<div><Stat label="Points" value={String(N)} /><Stat label="Scheme" value="Explicit FD" /><Stat label="CFL" value={speed <= 0.7 ? "ok" : "risky"} /></div>}
    >
      <canvas ref={canvasRef} width={W} height={H} onClick={pluck} className="h-auto w-full cursor-crosshair rounded-lg" />
    </StudioChrome>
  );
}
