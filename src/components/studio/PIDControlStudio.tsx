"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { Kp: number; Ki: number; Kd: number }> = {
  "Well-tuned": { Kp: 4, Ki: 1, Kd: 0.5 },
  "Under-damped": { Kp: 14, Ki: 1, Kd: 0 },
  "Oscillatory (high Ki)": { Kp: 6, Ki: 8, Kd: 0.3 },
  "Sluggish": { Kp: 1, Ki: 0.25, Kd: 0.5 },
};

// PID control of a 2nd-order plant, step response.
export function PIDControlStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ Kp, Ki, Kd }, update] = useShareableNumbers({ Kp: 4, Ki: 1, Kd: 0.5 });
  const [metrics, setMetrics] = useState({ overshoot: 0, settle: 0, ess: 0 });

  useEffect(() => {
    const W = 540, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // plant: 1/(s^2 + s) => y'' + y' = u
    const dt = 0.01, T = 8; const setpoint = 1; let y = 0, yd = 0, integ = 0, prevErr = 1;
    const ys: number[] = []; let peak = 0; let settleT = T;
    for (let t = 0; t < T / dt; t++) { const err = setpoint - y; integ += err * dt; const deriv = (err - prevErr) / dt; prevErr = err;
      const u = Kp * err + Ki * integ + Kd * deriv;
      const ydd = u - yd; yd += ydd * dt; y += yd * dt;
      if (t % 4 === 0) ys.push(y); peak = Math.max(peak, y);
      if (Math.abs(err) > 0.02) settleT = (t * dt); }
    const ess = Math.abs(setpoint - y); const overshoot = Math.max(0, (peak - setpoint) / setpoint * 100);
    setMetrics({ overshoot, settle: settleT, ess });
    const ox = 40, oy = H - 30, pw = W - 60, ph = H - 60;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // setpoint line
    ctx.strokeStyle = "#a3e635"; ctx.setLineDash([5, 4]); const spy = oy - (1 / 1.6) * ph; ctx.beginPath(); ctx.moveTo(ox, spy); ctx.lineTo(ox + pw, spy); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ys.forEach((v, i) => { const x = ox + (i / ys.length) * pw; const yy = oy - (v / 1.6) * ph; i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("step response", ox + 6, oy - ph + 12); ctx.fillStyle = "#bef264"; ctx.fillText("setpoint", ox + pw - 60, spy - 4); ctx.fillStyle = "#94a3b8"; ctx.fillText("time →", ox + pw - 50, oy + 18);
  }, [Kp, Ki, Kd]);

  const explain =
    Kd < 0.2
      ? "Almost no derivative damping: the proportional and integral terms push hard, so expect overshoot and ringing before the output settles."
      : Ki > 5
      ? "Heavy integral action erases steady-state error quickly but tends to overshoot and oscillate — watch the settling time climb."
      : Kp < 2
      ? "Low proportional gain makes the loop sluggish: it crawls toward the setpoint and may take a long time to close the gap."
      : "Balanced gains — proportional for speed, integral to remove offset, derivative to damp overshoot: the textbook well-tuned response.";

  const code = `Kp, Ki, Kd = ${Kp}, ${Ki}, ${Kd}
dt, T, sp = 0.01, 8.0, 1.0
y = yd = integ = 0.0; prev = 1.0
for _ in range(int(T / dt)):
    err = sp - y; integ += err * dt; deriv = (err - prev) / dt; prev = err
    u = Kp * err + Ki * integ + Kd * deriv
    ydd = u - yd; yd += ydd * dt; y += yd * dt
print("final output", round(y, 4))`;

  return (
    <StudioChrome title="PID Controller" tagline="step response tuning"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Proportional Kp" value={Kp} min={0} max={20} step={0.5} onChange={(v) => update({ Kp: v })} />
        <Slider label="Integral Ki" value={Ki} min={0} max={10} step={0.25} onChange={(v) => update({ Ki: v })} />
        <Slider label="Derivative Kd" value={Kd} min={0} max={5} step={0.1} onChange={(v) => update({ Kd: v })} />
        <p className="mt-3 text-xs text-slate-500">A PID controller drives a system to its setpoint using three terms: proportional reacts to the current error, integral eliminates steady-state offset, and derivative damps overshoot. Tuning the three gains trades off speed, overshoot, and stability — the workhorse of industrial control.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Overshoot" value={`${metrics.overshoot.toFixed(0)}%`} /><Stat label="Settling time" value={`${metrics.settle.toFixed(2)} s`} /><Stat label="Steady-state error" value={metrics.ess.toFixed(3)} /><Equation tex={`u(t) = ${Kp.toFixed(1)}\\,e(t) + ${Ki.toFixed(2)}\\int e\\,dt + ${Kd.toFixed(1)}\\frac{de}{dt}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
