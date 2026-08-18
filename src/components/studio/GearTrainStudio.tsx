"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { t1: number; t2: number; rpm: number; torque: number }> = {
  "3:1 reduction": { t1: 12, t2: 36, rpm: 90, torque: 4 },
  "Heavy winch": { t1: 8, t2: 60, rpm: 100, torque: 3 },
  "Overdrive": { t1: 40, t2: 12, rpm: 200, torque: 2 },
  "Near 1:1": { t1: 24, t2: 24, rpm: 120, torque: 5 },
};

export function GearTrainStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ t1, t2, rpm, torque }, update] = useShareableNumbers({ t1: 12, t2: 36, rpm: 60, torque: 2 });

  const ratio = t2 / t1, outRpm = rpm / ratio, outTorque = torque * ratio;
  const st = useRef({ a: 0 });

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(canvasRef.current!, W, H); let raf = 0, last = 0;
    const gear = (cx: number, cy: number, teeth: number, r: number, ang: number, col: string) => {
      ctx.fillStyle = col; ctx.beginPath(); const steps = teeth * 2;
      for (let i = 0; i <= steps; i++) { const rr = r * (i % 2 ? 1 : 0.82); const th = ang + i / steps * Math.PI * 2; const x = cx + Math.cos(th) * rr, y = cy + Math.sin(th) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.closePath(); ctx.fill(); ctx.fillStyle = "#020617"; ctx.beginPath(); ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2); ctx.fill();
    };
    const loop = (t: number) => {
      const dt = last ? (t - last) / 1000 : 0; last = t; st.current.a += (rpm / 60) * 2 * Math.PI * dt;
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const r1 = t1 * 2.4 + 10, r2 = t2 * 2.4 + 10, cx1 = 120, cx2 = cx1 + r1 + r2 - 12, cy = H / 2;
      gear(cx1, cy, t1, r1, st.current.a, "#22d3ee"); gear(cx2, cy, t2, r2, -st.current.a / ratio + Math.PI / t2, "#f472b6");
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("driver (cyan) → driven (pink)", 12, 20);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [t1, t2, rpm, ratio]);

  const explain =
    ratio > 1.5
      ? `Reduction drive: the driven gear turns ${ratio.toFixed(1)}× slower but multiplies torque ${ratio.toFixed(1)}× — trading speed for pulling force, like low gear on a bike.`
      : ratio < 0.67
      ? `Overdrive: the driven gear spins ${(1 / ratio).toFixed(1)}× faster but delivers proportionally less torque — power (speed × torque) is conserved, not created.`
      : "Near 1:1 — speed and torque pass through almost unchanged; this train mostly transmits motion rather than converting it.";

  const code = `t1, t2, rpm, torque = ${t1}, ${t2}, ${rpm}, ${torque}
ratio = t2 / t1
out_rpm = rpm / ratio
out_torque = torque * ratio
print("ratio", ratio, "out_rpm", out_rpm, "out_torque", out_torque)`;

  return (
    <StudioChrome title="Gear Train Ratios" tagline="trade speed for torque"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Driver teeth" value={t1} min={8} max={40} step={1} onChange={(v) => update({ t1: v })} />
        <Slider label="Driven teeth" value={t2} min={8} max={60} step={1} onChange={(v) => update({ t2: v })} />
        <Slider label="Input speed (rpm)" value={rpm} min={10} max={300} step={5} onChange={(v) => update({ rpm: v })} />
        <Slider label="Input torque (N·m)" value={torque} min={0.5} max={20} step={0.5} onChange={(v) => update({ torque: v })} />
        <p className="mt-3 text-xs text-slate-500">A larger driven gear turns slower but with proportionally more torque — the ratio equals the tooth-count ratio. Gears trade speed for force, exactly like a lever.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Gear ratio" value={`${ratio.toFixed(2)} : 1`} />
        <Stat label="Output speed" value={`${outRpm.toFixed(1)} rpm`} />
        <Stat label="Output torque" value={`${outTorque.toFixed(1)} N·m`} />
        <Equation tex={`\\frac{\\omega_{out}}{\\omega_{in}}=-\\frac{N_{in}}{N_{out}}=-\\frac{${t1}}{${t2}},\\quad \\tau_{out}=\\tau_{in}\\cdot\\frac{N_{out}}{N_{in}}=${outTorque.toFixed(1)}\\,\\text{N·m}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
