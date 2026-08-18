"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function GyroscopeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spin, setSpin] = useState(40);
  const [mass, setMass] = useState(0.5);
  const [radius, setRadius] = useState(0.05);
  const [pivot, setPivot] = useState(0.08);

  const I = 0.5 * mass * radius * radius;
  const precession = (mass * 9.81 * pivot) / (I * spin);
  const precPeriod = (2 * Math.PI) / precession;
  const stateRef = useRef({ phi: 0 });

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 320; let raf = 0, last = 0;
    const loop = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t; const st = stateRef.current; st.phi += precession * dt;
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2 + 50, lean = 0.5, L = 120;
      const ax = Math.sin(lean) * Math.cos(st.phi), az = Math.sin(lean) * Math.sin(st.phi), ay = Math.cos(lean);
      const tipx = cx + ax * L, tipy = cy - ay * L, sc = 1 + az * 0.25;
      ctx.strokeStyle = "#334155"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - L); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = "#f472b6"; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(cx, cy - L * Math.cos(lean), L * Math.sin(lean), L * Math.sin(lean) * 0.35, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.strokeStyle = "#64748b"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tipx, tipy); ctx.stroke();
      ctx.save(); ctx.translate(tipx, tipy); ctx.scale(1, 0.35); ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 6 * sc; ctx.beginPath(); ctx.arc(0, 0, 34 * sc, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("spinning disk precesses around the vertical", 12, 20);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [precession]);

  return (
    <StudioChrome title="Gyroscope & Precession" tagline="why a spinning top doesn't fall"
      controls={<div>
        <Slider label="Spin rate ω (rad/s)" value={spin} min={5} max={120} step={1} onChange={setSpin} />
        <Slider label="Disk mass (kg)" value={mass} min={0.1} max={2} step={0.1} onChange={setMass} />
        <Slider label="Disk radius (m)" value={radius} min={0.02} max={0.12} step={0.005} onChange={setRadius} />
        <Slider label="Pivot→CM distance (m)" value={pivot} min={0.02} max={0.15} step={0.005} onChange={setPivot} />
        <p className="mt-3 text-xs text-slate-500">Gravity applies a torque, but a fast-spinning disk responds by precessing sideways instead of toppling. Faster spin → slower precession: Ω = mgr / (Iω).</p>
      </div>}
      inspector={<div>
        <Stat label="Precession rate Ω" value={`${precession.toFixed(2)} rad/s`} />
        <Stat label="Precession period" value={`${precPeriod.toFixed(1)} s`} />
        <Stat label="Spin inertia I" value={`${I.toExponential(2)} kg·m²`} />
      </div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
