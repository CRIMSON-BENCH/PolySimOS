"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function PidTunerStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [Kp, setKp] = useState(4), [Ki, setKi] = useState(1), [Kd, setKd] = useState(1.5);
  // plant: x'' + c x' + k x = u ; control to setpoint 1
  const sim = () => { let x = 0, v = 0, integ = 0, prevE = 1; const dt = 0.02, out: number[] = []; let over = 0, settleT = -1;
    for (let i = 0; i < 500; i++) { const e = 1 - x; integ += e * dt; const de = (e - prevE) / dt; prevE = e; const u = Kp * e + Ki * integ + Kd * de; const a = u - 1.0 * v - 1.5 * x; v += a * dt; x += v * dt; out.push(x); over = Math.max(over, x); if (Math.abs(1 - x) < 0.02 && settleT < 0) settleT = i * dt; else if (Math.abs(1 - x) >= 0.02) settleT = -1; }
    return { out, over, settleT }; };
  const { out, over, settleT } = sim();

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 30, pw = W - 55, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); const setY = oy - (1 / 1.8) * ph; ctx.beginPath(); ctx.moveTo(ox, setY); ctx.lineTo(ox + pw, setY); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); out.forEach((y, i) => { const x = ox + i / out.length * pw, yy = oy - (y / 1.8) * ph; i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("closed-loop step response (dashed = setpoint)", ox + 6, oy - ph + 12); ctx.fillText("time →", ox + pw - 44, oy + 18);
  }, [Kp, Ki, Kd, out]);

  return (
    <StudioChrome title="PID Controller Tuner" tagline="tame a system with feedback"
      controls={<div>
        <Slider label="Proportional Kp" value={Kp} min={0} max={20} step={0.5} onChange={setKp} />
        <Slider label="Integral Ki" value={Ki} min={0} max={10} step={0.25} onChange={setKi} />
        <Slider label="Derivative Kd" value={Kd} min={0} max={10} step={0.25} onChange={setKd} />
        <p className="mt-3 text-xs text-slate-500">A PID controller drives a system to a target using three terms: proportional reacts to the current error, integral erases steady offset, and derivative damps overshoot. Tuning them trades speed against stability. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Peak overshoot" value={`${((over - 1) * 100).toFixed(0)}%`} />
        <Stat label="Settling time" value={settleT > 0 ? `${settleT.toFixed(1)} s` : "not settled"} />
        <Stat label="Final value" value={out[out.length - 1].toFixed(3)} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
