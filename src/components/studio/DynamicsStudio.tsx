"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ODE_SYSTEMS,
  getOdeSystem,
  integrate,
  grayScottInit,
  grayScottStep,
  GrayScottState,
} from "@/lib/engines/dynamics";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 760, H = 480;

export function DynamicsStudio() {
  const [systemId, setSystemId] = useState("lorenz");
  const isPde = systemId === "grayscott";
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {ODE_SYSTEMS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSystemId(s.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              systemId === s.id
                ? "bg-cyan-600 text-white"
                : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"
            }`}
          >
            {s.name}
          </button>
        ))}
        <button
          onClick={() => setSystemId("grayscott")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            systemId === "grayscott"
              ? "bg-cyan-600 text-white"
              : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"
          }`}
        >
          Gray–Scott (PDE)
        </button>
      </div>
      {isPde ? <GrayScott /> : <OdePlot key={systemId} systemId={systemId} />}
    </div>
  );
}

function OdePlot({ systemId }: { systemId: string }) {
  const sys = getOdeSystem(systemId)!;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [params, setParams] = useState<Record<string, number>>(
    () => Object.fromEntries(sys.params.map((p) => [p.key, p.default]))
  );

  const traj = useMemo(() => {
    const f = sys.make(params);
    return integrate(f, sys.y0, sys.T, sys.h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemId, JSON.stringify(params)]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, W, H);

    if (sys.phase) {
      // phase portrait of two state variables
      const [ia, ib] = sys.phase;
      let minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity;
      for (const s of traj) {
        minA = Math.min(minA, s.y[ia]); maxA = Math.max(maxA, s.y[ia]);
        minB = Math.min(minB, s.y[ib]); maxB = Math.max(maxB, s.y[ib]);
      }
      const pad = 40;
      const sx = (v: number) => pad + ((v - minA) / (maxA - minA || 1)) * (W - 2 * pad);
      const sy = (v: number) => H - pad - ((v - minB) / (maxB - minB || 1)) * (H - 2 * pad);
      ctx.lineWidth = 1.2;
      for (let i = 1; i < traj.length; i++) {
        const t = i / traj.length;
        ctx.strokeStyle = `hsl(${190 - t * 120}, 90%, 60%)`;
        ctx.beginPath();
        ctx.moveTo(sx(traj[i - 1].y[ia]), sy(traj[i - 1].y[ib]));
        ctx.lineTo(sx(traj[i].y[ia]), sy(traj[i].y[ib]));
        ctx.stroke();
      }
      label(ctx, `${sys.vars[ia]} vs ${sys.vars[ib]} (phase portrait)`);
    } else {
      // time series of all variables
      let min = Infinity, max = -Infinity;
      for (const s of traj) for (const v of s.y) { min = Math.min(min, v); max = Math.max(max, v); }
      const pad = 40;
      const colors = ["#22d3ee", "#a3e635", "#f472b6", "#fbbf24"];
      sys.vars.forEach((_, vi) => {
        ctx.strokeStyle = colors[vi % colors.length];
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        traj.forEach((s, i) => {
          const x = pad + (i / traj.length) * (W - 2 * pad);
          const y = H - pad - ((s.y[vi] - min) / (max - min || 1)) * (H - 2 * pad);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
      });
      // legend
      sys.vars.forEach((name, vi) => {
        ctx.fillStyle = colors[vi % colors.length];
        ctx.fillRect(pad + vi * 70, 16, 10, 10);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "12px system-ui";
        ctx.fillText(name, pad + vi * 70 + 14, 25);
      });
      label(ctx, "time series");
    }
  }, [traj, sys]);

  const last = traj[traj.length - 1];

  return (
    <StudioChrome
      title={`Dynamics — ${sys.name}`}
      tagline="RK4 integrator"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">{sys.description}</p>
          {sys.params.map((p) => (
            <Slider
              key={p.key}
              label={p.label}
              value={params[p.key]}
              min={p.min}
              max={p.max}
              step={p.step}
              onChange={(v) => setParams((prev) => ({ ...prev, [p.key]: v }))}
            />
          ))}
          <button
            onClick={() => setParams(Object.fromEntries(sys.params.map((p) => [p.key, p.default])))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Reset parameters
          </button>
        </div>
      }
      inspector={
        <div>
          <Stat label="Steps" value={String(traj.length)} />
          <Stat label="Integrator" value="RK4" />
          {sys.vars.map((name, i) => (
            <Stat key={name} label={`final ${name}`} value={last.y[i].toFixed(3)} />
          ))}
        </div>
      }
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}

function label(ctx: CanvasRenderingContext2D, text: string) {
  ctx.fillStyle = "#475569";
  ctx.font = "11px system-ui";
  ctx.fillText(text, W - 8 - ctx.measureText(text).width, H - 12);
}

function GrayScott() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GrayScottState | null>(null);
  const rafRef = useRef<number>(0);
  const N = 140;
  const [running, setRunning] = useState(true);
  const [feed, setFeed] = useState(0.055);
  const [kill, setKill] = useState(0.062);

  useEffect(() => {
    stateRef.current = grayScottInit(N, 1);
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    const img = ctx.createImageData(N, N);
    const loop = () => {
      const st = stateRef.current!;
      if (running) grayScottStep(st, { feed, kill, du: 0.16, dv: 0.08 }, 6);
      for (let i = 0; i < N * N; i++) {
        const v = Math.min(1, Math.max(0, st.v[i]));
        const c = Math.floor(v * 255);
        img.data[i * 4] = c * 0.2;
        img.data[i * 4 + 1] = c;
        img.data[i * 4 + 2] = 120 + c * 0.5;
        img.data[i * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, feed, kill]);

  return (
    <StudioChrome
      title="Dynamics — Gray–Scott Reaction–Diffusion (PDE)"
      tagline="explicit finite difference · Turing patterns"
      controls={
        <div>
          <div className="mb-3 flex gap-2">
            <button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">
              {running ? "Pause" : "Play"}
            </button>
            <button onClick={() => (stateRef.current = grayScottInit(N, (Math.floor(feed * 1000) % 97) + 1))} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Reseed
            </button>
          </div>
          <p className="mb-3 text-xs text-slate-500">Feed &amp; kill rates select the Turing pattern regime — spots, stripes, or mazes.</p>
          <Slider label="Feed rate" value={feed} min={0.01} max={0.09} step={0.001} onChange={setFeed} />
          <Slider label="Kill rate" value={kill} min={0.045} max={0.07} step={0.001} onChange={setKill} />
        </div>
      }
      inspector={
        <div>
          <Stat label="Grid" value={`${N}×${N}`} />
          <Stat label="Scheme" value="Explicit FD" />
          <Stat label="Iterations/frame" value="6" />
        </div>
      }
    >
      <canvas ref={canvasRef} width={N} height={N} className="mx-auto h-auto max-h-[440px] w-auto max-w-full rounded-lg" style={{ imageRendering: "pixelated", width: "440px" }} />
    </StudioChrome>
  );
}
