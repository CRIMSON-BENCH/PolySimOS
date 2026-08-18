"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { Kp: number; Ki: number; Kd: number }> = {
  "Sluggish (P-only)": { Kp: 2, Ki: 0, Kd: 0 },
  "Balanced PID": { Kp: 4, Ki: 1, Kd: 1.5 },
  "Aggressive": { Kp: 14, Ki: 4, Kd: 1 },
  "Well-damped": { Kp: 8, Ki: 2, Kd: 6 },
};

export function PidTunerStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ Kp, Ki, Kd }, update] = useShareableNumbers({ Kp: 4, Ki: 1, Kd: 1.5 });
  // plant: x'' + c x' + k x = u ; control to setpoint 1
  const sim = () => { let x = 0, v = 0, integ = 0, prevE = 1; const dt = 0.02, out: number[] = []; let over = 0, settleT = -1;
    for (let i = 0; i < 500; i++) { const e = 1 - x; integ += e * dt; const de = (e - prevE) / dt; prevE = e; const u = Kp * e + Ki * integ + Kd * de; const a = u - 1.0 * v - 1.5 * x; v += a * dt; x += v * dt; out.push(x); over = Math.max(over, x); if (Math.abs(1 - x) < 0.02 && settleT < 0) settleT = i * dt; else if (Math.abs(1 - x) >= 0.02) settleT = -1; }
    return { out, over, settleT }; };
  const { out, over, settleT } = sim();

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 30, pw = W - 55, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); const setY = oy - (1 / 1.8) * ph; ctx.beginPath(); ctx.moveTo(ox, setY); ctx.lineTo(ox + pw, setY); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); out.forEach((y, i) => { const x = ox + i / out.length * pw, yy = oy - (y / 1.8) * ph; i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("closed-loop step response (dashed = setpoint)", ox + 6, oy - ph + 12); ctx.fillText("time →", ox + pw - 44, oy + 18);
  }, [Kp, Ki, Kd, out]);

  const overshoot = (over - 1) * 100;
  const explain =
    Ki === 0
      ? "With no integral term the loop settles below the setpoint — proportional action alone leaves steady-state offset that only Ki can erase."
      : overshoot > 25
      ? "Large overshoot: proportional/integral action is strong relative to damping. Raise Kd or lower Kp to trade some speed for stability."
      : settleT < 0
      ? "The response never settles within ±2% — the loop is oscillatory or unstable, so back off Kp and Ki and add derivative damping."
      : overshoot < 5
      ? "Well-damped: small overshoot and a clean settle. Derivative action is taming the response without stalling it — a healthy tune."
      : "A balanced tune: modest overshoot with a reasonable settling time, the classic speed-versus-stability compromise.";

  const code = `import numpy as np
Kp, Ki, Kd = ${Kp}, ${Ki}, ${Kd}
dt = 0.02; x = v = integ = 0.0; prevE = 1.0; out = []
for i in range(500):
    e = 1 - x; integ += e*dt; de = (e - prevE)/dt; prevE = e
    u = Kp*e + Ki*integ + Kd*de
    a = u - 1.0*v - 1.5*x; v += a*dt; x += v*dt
    out.append(x)
print("overshoot %", (max(out) - 1)*100, "final", out[-1])`;

  return (
    <StudioChrome title="PID Controller Tuner" tagline="tame a system with feedback"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Proportional Kp" value={Kp} min={0} max={20} step={0.5} onChange={(v) => update({ Kp: v })} />
        <Slider label="Integral Ki" value={Ki} min={0} max={10} step={0.25} onChange={(v) => update({ Ki: v })} />
        <Slider label="Derivative Kd" value={Kd} min={0} max={10} step={0.25} onChange={(v) => update({ Kd: v })} />
        <p className="mt-3 text-xs text-slate-500">A PID controller drives a system to a target using three terms: proportional reacts to the current error, integral erases steady offset, and derivative damps overshoot. Tuning them trades speed against stability. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Peak overshoot" value={`${overshoot.toFixed(0)}%`} />
        <Stat label="Settling time" value={settleT > 0 ? `${settleT.toFixed(1)} s` : "not settled"} />
        <Stat label="Final value" value={out[out.length - 1].toFixed(3)} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
