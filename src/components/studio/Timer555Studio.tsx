"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function Timer555Studio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [r1, setR1] = useState(10), [r2, setR2] = useState(47), [cap, setCap] = useState(10);
  const R1 = r1 * 1000, R2 = r2 * 1000, C = cap * 1e-6;
  const f = 1.44 / ((R1 + 2 * R2) * C), duty = (R1 + R2) / (R1 + 2 * R2);
  const thigh = 0.693 * (R1 + R2) * C, tlow = 0.693 * R2 * C;

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const oy = H / 2, amp = 70, period = (W - 60) / 6;
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); let x = 30; ctx.moveTo(x, oy + amp);
    for (let cyc = 0; cyc < 6; cyc++) { const wh = period * duty, wl = period * (1 - duty); ctx.lineTo(x, oy - amp); ctx.lineTo(x + wh, oy - amp); ctx.lineTo(x + wh, oy + amp); ctx.lineTo(x + wh + wl, oy + amp); x += period; }
    ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`output square wave · ${f.toFixed(1)} Hz · ${(duty * 100).toFixed(0)}% duty`, 30, 30);
  }, [r1, r2, cap, f, duty]);

  return (
    <StudioChrome title="555 Timer (Astable)" tagline="the classic square-wave oscillator"
      controls={<div>
        <Slider label="R1 (kΩ)" value={r1} min={1} max={100} step={1} onChange={setR1} />
        <Slider label="R2 (kΩ)" value={r2} min={1} max={100} step={1} onChange={setR2} />
        <Slider label="C (µF)" value={cap} min={0.1} max={100} step={0.1} onChange={setCap} />
        <p className="mt-3 text-xs text-slate-500">In astable mode the 555 oscillates on its own, charging the capacitor through R1+R2 and discharging through R2. Frequency f = 1.44 / ((R1+2R2)·C), and the duty cycle always exceeds 50% for this classic circuit. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Frequency" value={`${f.toFixed(1)} Hz`} />
        <Stat label="Duty cycle" value={`${(duty * 100).toFixed(0)}%`} />
        <Stat label="High time" value={`${(thigh * 1000).toFixed(2)} ms`} />
        <Stat label="Low time" value={`${(tlow * 1000).toFixed(2)} ms`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
