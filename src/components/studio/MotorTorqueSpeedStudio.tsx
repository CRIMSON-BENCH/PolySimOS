"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function MotorTorqueSpeedStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [tstall, setTstall] = useState(2), [wfree, setWfree] = useState(500), [load, setLoad] = useState(0.8);
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

  return (
    <StudioChrome title="DC Motor Torque–Speed" tagline="where torque meets power"
      controls={<div>
        <Slider label="Stall torque (N·m)" value={tstall} min={0.5} max={10} step={0.5} onChange={setTstall} />
        <Slider label="No-load speed (rpm)" value={wfree} min={100} max={3000} step={50} onChange={setWfree} />
        <Slider label="Load torque (N·m)" value={load} min={0} max={tstall} step={0.1} onChange={setLoad} />
        <p className="mt-3 text-xs text-slate-500">A DC motor trades torque for speed along a straight line: maximum torque at stall, maximum speed at no load. Mechanical power (torque × speed) peaks right in the middle, at half the no-load speed. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Operating speed" value={`${Math.max(0, wop).toFixed(0)} rpm`} />
        <Stat label="Output power" value={`${pOp.toFixed(1)} W`} />
        <Stat label="Peak power" value={`${pPeak.toFixed(1)} W @ ${wPeak.toFixed(0)} rpm`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
