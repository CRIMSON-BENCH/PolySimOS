"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 760, H = 480;

export function RLCStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [R, setR] = useState(1.5);
  const [L, setL] = useState(1);
  const [C, setC] = useState(1);

  const data = useMemo(() => {
    // series RLC step response: L q'' + R q' + q/C = V0
    let q = 0, i = 0; const dt = 0.01, V0 = 1; const pts: { t: number; q: number; i: number }[] = [];
    for (let k = 0; k < 4000; k++) {
      const di = (V0 - R * i - q / C) / L; i += di * dt; q += i * dt; pts.push({ t: k * dt, q, i });
    }
    return pts;
  }, [R, L, C]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const pad = 34, T = data[data.length - 1].t;
    const qs = data.map((d) => d.q), is = data.map((d) => d.i);
    const lo = Math.min(0, ...qs, ...is), hi = Math.max(...qs, ...is, 0.1);
    const sx = (t: number) => pad + (t / T) * (W - 2 * pad); const sy = (v: number) => H - pad - ((v - lo) / (hi - lo)) * (H - 2 * pad);
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(pad, sy(0)); ctx.lineTo(W - pad, sy(0)); ctx.stroke();
    const draw = (key: "q" | "i", color: string) => { ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); data.forEach((d, k) => k ? ctx.lineTo(sx(d.t), sy(d[key])) : ctx.moveTo(sx(d.t), sy(d[key]))); ctx.stroke(); };
    draw("q", "#22d3ee"); draw("i", "#a3e635");
    ctx.font = "12px system-ui"; ctx.fillStyle = "#22d3ee"; ctx.fillText("charge q(t)", pad, 22); ctx.fillStyle = "#a3e635"; ctx.fillText("current i(t)", pad + 110, 22);
    const zeta = R / 2 * Math.sqrt(C / L);
    ctx.fillStyle = "#94a3b8"; ctx.fillText(zeta < 1 ? "underdamped (oscillatory)" : zeta > 1 ? "overdamped" : "critically damped", W - 240, H - 14);
  }, [data]);

  const zeta = (R / 2) * Math.sqrt(C / L);
  return (
    <StudioChrome title="RLC Circuit Studio" tagline="series RLC step response"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Apply a step voltage to a series RLC circuit and watch charge and current respond — under-, over-, or critically damped.</p>
        <Slider label="Resistance R" value={R} min={0} max={6} step={0.1} onChange={setR} />
        <Slider label="Inductance L" value={L} min={0.2} max={4} step={0.1} onChange={setL} />
        <Slider label="Capacitance C" value={C} min={0.2} max={4} step={0.1} onChange={setC} />
      </div>}
      inspector={<div><Stat label="Damping ζ" value={zeta.toFixed(3)} /><Stat label="Regime" value={zeta < 1 ? "underdamped" : zeta > 1 ? "overdamped" : "critical"} /><Stat label="ω₀" value={(1 / Math.sqrt(L * C)).toFixed(3)} /></div>}
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
