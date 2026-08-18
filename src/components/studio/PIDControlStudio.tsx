"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// PID control of a 2nd-order plant, step response.
export function PIDControlStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [Kp, setKp] = useState(4);
  const [Ki, setKi] = useState(1);
  const [Kd, setKd] = useState(0.5);
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

  return (
    <StudioChrome title="PID Controller" tagline="step response tuning"
      controls={<div>
        <Slider label="Proportional Kp" value={Kp} min={0} max={20} step={0.5} onChange={setKp} />
        <Slider label="Integral Ki" value={Ki} min={0} max={10} step={0.25} onChange={setKi} />
        <Slider label="Derivative Kd" value={Kd} min={0} max={5} step={0.1} onChange={setKd} />
        <p className="mt-3 text-xs text-slate-500">A PID controller drives a system to its setpoint using three terms: proportional reacts to the current error, integral eliminates steady-state offset, and derivative damps overshoot. Tuning the three gains trades off speed, overshoot, and stability — the workhorse of industrial control.</p>
      </div>}
      inspector={<div><Stat label="Overshoot" value={`${metrics.overshoot.toFixed(0)}%`} /><Stat label="Settling time" value={`${metrics.settle.toFixed(2)} s`} /><Stat label="Steady-state error" value={metrics.ess.toFixed(3)} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
