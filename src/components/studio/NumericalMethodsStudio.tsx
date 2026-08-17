"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 760, H = 440;
// Solve dy/dt = y (exact: e^t) so we can show error clearly.
const f = (t: number, y: number) => y;
const exact = (t: number) => Math.exp(t);

export function NumericalMethodsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [h, setH] = useState(0.5);

  const { euler, rk4, errE, errR } = useMemo(() => {
    const T = 3; const eu: [number, number][] = [[0, 1]], rk: [number, number][] = [[0, 1]];
    let ye = 1, yr = 1;
    for (let t = 0; t < T; t += h) {
      ye = ye + h * f(t, ye); eu.push([t + h, ye]);
      const k1 = f(t, yr), k2 = f(t + h / 2, yr + h / 2 * k1), k3 = f(t + h / 2, yr + h / 2 * k2), k4 = f(t + h, yr + h * k3);
      yr = yr + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4); rk.push([t + h, yr]);
    }
    return { euler: eu, rk4: rk, errE: Math.abs(ye - exact(T)), errR: Math.abs(yr - exact(T)) };
  }, [h]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H); const pad = 40, T = 3, maxY = exact(T) * 1.05;
    const sx = (t: number) => pad + (t / T) * (W - 2 * pad); const sy = (y: number) => H - pad - (y / maxY) * (H - 2 * pad);
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(pad, sy(0)); ctx.lineTo(W - pad, sy(0)); ctx.stroke();
    // exact
    ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 2.5; ctx.beginPath(); for (let t = 0; t <= T; t += 0.02) { t === 0 ? ctx.moveTo(sx(t), sy(exact(t))) : ctx.lineTo(sx(t), sy(exact(t))); } ctx.stroke();
    const drawPts = (pts: [number, number][], color: string) => { ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(sx(p[0]), sy(p[1])) : ctx.moveTo(sx(p[0]), sy(p[1]))); ctx.stroke(); pts.forEach((p) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(sx(p[0]), sy(p[1]), 3, 0, 7); ctx.fill(); }); };
    drawPts(euler, "#f472b6"); drawPts(rk4, "#a3e635");
    ctx.font = "12px system-ui"; ctx.fillStyle = "#e2e8f0"; ctx.fillText("exact eᵗ", pad, 22); ctx.fillStyle = "#f472b6"; ctx.fillText("Euler", pad + 70, 22); ctx.fillStyle = "#a3e635"; ctx.fillText("RK4", pad + 130, 22);
  }, [euler, rk4]);

  return (
    <StudioChrome title="Numerical Methods — Euler vs RK4" tagline="ODE integration accuracy"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Solving dy/dt = y (true answer eᵗ). Euler drifts badly at large step sizes; RK4 hugs the exact curve. Shrink the step and both improve — RK4 far faster.</p>
        <Slider label="Step size h" value={h} min={0.1} max={1} step={0.05} onChange={setH} />
      </div>}
      inspector={<div><Stat label="Step h" value={h.toFixed(2)} /><Stat label="Euler error" value={errE.toFixed(3)} /><Stat label="RK4 error" value={errR.toExponential(2)} /><Stat label="RK4 order" value="4th" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
