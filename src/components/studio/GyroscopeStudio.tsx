"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { spin: number; mass: number; radius: number; pivot: number }> = {
  "Fast top (slow drift)": { spin: 120, mass: 0.5, radius: 0.05, pivot: 0.08 },
  "Slow wobble": { spin: 10, mass: 0.5, radius: 0.05, pivot: 0.08 },
  "Heavy flywheel": { spin: 40, mass: 2, radius: 0.12, pivot: 0.1 },
  "Long lever arm": { spin: 40, mass: 0.5, radius: 0.05, pivot: 0.15 },
};

export function GyroscopeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ spin, mass, radius, pivot }, update] = useShareableNumbers({ spin: 40, mass: 0.5, radius: 0.05, pivot: 0.08 });

  const I = 0.5 * mass * radius * radius;
  const precession = (mass * 9.81 * pivot) / (I * spin);
  const precPeriod = (2 * Math.PI) / precession;
  const stateRef = useRef({ phi: 0 });

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(canvasRef.current!, W, H); let raf = 0, last = 0;
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

  const explain =
    spin >= 100
      ? "Fast spin, slow precession: because Ω = mgr/(Iω), the huge angular momentum makes the top drift around only lazily — it looks almost frozen upright."
      : spin <= 15
      ? "Slow spin, fast precession: with little angular momentum the gravity torque swings the axis around quickly, and in reality the top would soon topple."
      : mass * pivot >= 0.25
      ? "Big gravity torque (heavy disk or long lever arm) speeds up precession — the sideways drift is driven by mgr in the numerator."
      : `Gravity's torque never tips the top; it steers the spin axis in a circle every ${precPeriod.toFixed(1)} s, the hallmark of gyroscopic precession.`;

  const code = `import numpy as np
spin, mass, radius, pivot = ${spin}, ${mass}, ${radius}, ${pivot}  # rad/s, kg, m, m
I = 0.5 * mass * radius**2
Omega = mass * 9.81 * pivot / (I * spin)  # precession rate, rad/s
print("precession rate", round(Omega, 3), "rad/s")
print("precession period", round(2*np.pi/Omega, 2), "s")`;

  return (
    <StudioChrome title="Gyroscope & Precession" tagline="why a spinning top doesn't fall"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Spin rate ω (rad/s)" value={spin} min={5} max={120} step={1} onChange={(v) => update({ spin: v })} />
        <Slider label="Disk mass (kg)" value={mass} min={0.1} max={2} step={0.1} onChange={(v) => update({ mass: v })} />
        <Slider label="Disk radius (m)" value={radius} min={0.02} max={0.12} step={0.005} onChange={(v) => update({ radius: v })} />
        <Slider label="Pivot→CM distance (m)" value={pivot} min={0.02} max={0.15} step={0.005} onChange={(v) => update({ pivot: v })} />
        <p className="mt-3 text-xs text-slate-500">Gravity applies a torque, but a fast-spinning disk responds by precessing sideways instead of toppling. Faster spin → slower precession: Ω = mgr / (Iω).</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Precession rate Ω" value={`${precession.toFixed(2)} rad/s`} />
        <Stat label="Precession period" value={`${precPeriod.toFixed(1)} s`} />
        <Stat label="Spin inertia I" value={`${I.toExponential(2)} kg·m²`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
