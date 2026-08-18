"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { tstall: number; wfree: number; load: number }> = {
  "Hobby motor": { tstall: 2, wfree: 500, load: 0.8 },
  "High-torque gearmotor": { tstall: 8, wfree: 300, load: 4 },
  "High-speed fan": { tstall: 1, wfree: 3000, load: 0.3 },
  "Near stall (heavy)": { tstall: 5, wfree: 1000, load: 4.5 },
};

export function MotorTorqueSpeedStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ tstall, wfree, load }, update] = useShareableNumbers({ tstall: 2, wfree: 500, load: 0.8 });
  // torque-speed line: T = Tstall (1 - w/wfree). Operating point where T = load
  const wop = wfree * (1 - load / tstall);
  const powerAt = (w: number) => tstall * (1 - w / wfree) * w * 2 * Math.PI / 60;
  const wPeak = wfree / 2, pPeak = powerAt(wPeak);
  const pOp = load * wop * 2 * Math.PI / 60;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // torque line
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox, oy - ph); ctx.lineTo(ox + pw, oy); ctx.stroke();
    // power curve (parabola)
    ctx.strokeStyle = "#a3e635"; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const w = wfree * i / pw; const p = powerAt(w) / pPeak; const y = oy - p * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    // load line
    const ly = oy - (load / tstall) * ph; ctx.strokeStyle = "#f472b6"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(ox, ly); ctx.lineTo(ox + pw, ly); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("torque (cyan) · power (green) · load (pink)", ox + 6, oy - ph + 12); ctx.fillText("speed →", ox + pw - 50, oy + 18);
  }, [tstall, wfree, load, pPeak]);

  const ratio = load / tstall;
  const explain =
    load >= tstall
      ? "Load meets or exceeds the stall torque, so the motor cannot turn — it sits at zero speed drawing maximum current."
      : ratio > 0.55
      ? "Heavy load: the motor runs below half its no-load speed. Plenty of torque, but you are well past the power peak."
      : ratio < 0.45
      ? "Light load: the motor spins up past half-speed toward no-load, trading available torque away for RPM."
      : "Load is about half the stall torque, so the motor runs near half its no-load speed — right where mechanical power peaks.";

  const code = `import numpy as np
tstall, wfree, load = ${tstall}, ${wfree}, ${load}
wop = wfree*(1 - load/tstall)  # operating speed, rpm
power = lambda w: tstall*(1 - w/wfree)*w*2*np.pi/60
print("op speed", max(0, wop), "peak power", power(wfree/2), "@", wfree/2)`;

  return (
    <StudioChrome title="DC Motor Torque–Speed" tagline="where torque meets power"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Stall torque (N·m)" value={tstall} min={0.5} max={10} step={0.5} onChange={(v) => update({ tstall: v })} />
        <Slider label="No-load speed (rpm)" value={wfree} min={100} max={3000} step={50} onChange={(v) => update({ wfree: v })} />
        <Slider label="Load torque (N·m)" value={load} min={0} max={tstall} step={0.1} onChange={(v) => update({ load: v })} />
        <p className="mt-3 text-xs text-slate-500">A DC motor trades torque for speed along a straight line: maximum torque at stall, maximum speed at no load. Mechanical power (torque × speed) peaks right in the middle, at half the no-load speed. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Operating speed" value={`${Math.max(0, wop).toFixed(0)} rpm`} />
        <Stat label="Output power" value={`${pOp.toFixed(1)} W`} />
        <Stat label="Peak power" value={`${pPeak.toFixed(1)} W @ ${wPeak.toFixed(0)} rpm`} />
        <Equation tex={`\\tau = ${tstall}\\left(1 - \\dfrac{\\omega}{${wfree}}\\right),\\quad \\omega_{op} = ${Math.max(0, wop).toFixed(0)}\\ \\text{rpm}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
