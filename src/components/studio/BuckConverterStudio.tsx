"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function BuckConverterStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [vin, setVin] = useState(12), [duty, setDuty] = useState(0.42), [L, setL] = useState(100), [fsw, setFsw] = useState(100), [iout, setIout] = useState(1);
  const vout = duty * vin;
  const dIL = (vin - vout) * duty / (L * 1e-6 * fsw * 1000); // A
  const ripplePct = iout > 0 ? (dIL / iout) * 100 : 0;

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const oy = H / 2 + 40, amp = 60, period = (W - 60) / 4;
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let cyc = 0; cyc < 4; cyc++) { const x0 = 30 + cyc * period; const on = period * duty; ctx.moveTo(x0, oy); ctx.lineTo(x0 + on, oy - amp); ctx.lineTo(x0 + period, oy + 0); }
    // inductor current triangle
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2; ctx.beginPath(); const iy = H / 2 - 20, ia = Math.min(50, ripplePct / 2);
    for (let cyc = 0; cyc < 4; cyc++) { const x0 = 30 + cyc * period; const on = period * duty; if (cyc === 0) ctx.moveTo(x0, iy + ia); ctx.lineTo(x0 + on, iy - ia); ctx.lineTo(x0 + period, iy + ia); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("switch node (cyan) · inductor current ripple (green)", 30, 24);
  }, [vin, duty, L, fsw, iout, ripplePct]);

  return (
    <StudioChrome title="Buck Converter" tagline="step-down switching regulator"
      controls={<div>
        <Slider label="Input Vin (V)" value={vin} min={5} max={48} step={1} onChange={setVin} />
        <Slider label="Duty cycle D" value={duty} min={0.05} max={0.95} step={0.01} onChange={setDuty} />
        <Slider label="Inductor L (µH)" value={L} min={4.7} max={470} step={4.7} onChange={setL} />
        <Slider label="Switching freq (kHz)" value={fsw} min={20} max={2000} step={20} onChange={setFsw} />
        <Slider label="Load current (A)" value={iout} min={0.1} max={10} step={0.1} onChange={setIout} />
        <p className="mt-3 text-xs text-slate-500">A buck converter chops the input at a fast switching frequency; the inductor and capacitor average it to a lower DC output, Vout = D·Vin. Bigger inductors and faster switching shrink the current ripple. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Output voltage" value={`${vout.toFixed(2)} V`} />
        <Stat label="Inductor ripple ΔIL" value={`${dIL.toFixed(2)} A`} />
        <Stat label="Ripple / load" value={`${ripplePct.toFixed(0)}%`} />
        <Stat label="Mode" value={dIL / 2 > iout ? "discontinuous" : "continuous"} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
