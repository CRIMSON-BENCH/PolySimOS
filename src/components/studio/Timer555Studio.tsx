"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { r1: number; r2: number; cap: number }> = {
  "1 Hz blinker": { r1: 47, r2: 47, cap: 10 },
  "Audio tone (~1 kHz)": { r1: 1, r2: 10, cap: 0.1 },
  "Near 50% duty": { r1: 1, r2: 100, cap: 1 },
  "Slow LED fade": { r1: 100, r2: 100, cap: 47 },
};

export function Timer555Studio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ r1, r2, cap }, update] = useShareableNumbers({ r1: 10, r2: 47, cap: 10 });
  const R1 = r1 * 1000, R2 = r2 * 1000, C = cap * 1e-6;
  const f = 1.44 / ((R1 + 2 * R2) * C), duty = (R1 + R2) / (R1 + 2 * R2);
  const thigh = 0.693 * (R1 + R2) * C, tlow = 0.693 * R2 * C;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const oy = H / 2, amp = 70, period = (W - 60) / 6;
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); let x = 30; ctx.moveTo(x, oy + amp);
    for (let cyc = 0; cyc < 6; cyc++) { const wh = period * duty, wl = period * (1 - duty); ctx.lineTo(x, oy - amp); ctx.lineTo(x + wh, oy - amp); ctx.lineTo(x + wh, oy + amp); ctx.lineTo(x + wh + wl, oy + amp); x += period; }
    ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`output square wave · ${f.toFixed(1)} Hz · ${(duty * 100).toFixed(0)}% duty`, 30, 30);
  }, [r1, r2, cap, f, duty]);

  const explain =
    f >= 1000
      ? `At ${(f / 1000).toFixed(1)} kHz this is in audio range — you'd hear a tone. Frequency rises as R1, R2, or C shrink.`
      : f < 2
      ? `A slow ${f.toFixed(2)} Hz output (period ${(1 / f).toFixed(2)} s) suits an LED blinker; the large ${cap} µF capacitor dominates the timing.`
      : `f = 1.44/((R1+2·R2)·C) = ${f.toFixed(1)} Hz. Duty is ${(duty * 100).toFixed(0)}% — it stays above 50% because the charge path (R1+R2) is longer than the discharge path (R2).`;

  const code = `# 555 astable timer
r1_k, r2_k, cap_uf = ${r1}, ${r2}, ${cap}
R1, R2, C = r1_k * 1e3, r2_k * 1e3, cap_uf * 1e-6
f = 1.44 / ((R1 + 2 * R2) * C)
duty = (R1 + R2) / (R1 + 2 * R2)
t_high = 0.693 * (R1 + R2) * C
t_low = 0.693 * R2 * C
print("f", round(f, 2), "Hz  duty", round(duty * 100, 1), "%")
print("t_high", round(t_high * 1000, 3), "ms  t_low", round(t_low * 1000, 3), "ms")`;

  return (
    <StudioChrome title="555 Timer (Astable)" tagline="the classic square-wave oscillator"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="R1 (kΩ)" value={r1} min={1} max={100} step={1} onChange={(v) => update({ r1: v })} />
        <Slider label="R2 (kΩ)" value={r2} min={1} max={100} step={1} onChange={(v) => update({ r2: v })} />
        <Slider label="C (µF)" value={cap} min={0.1} max={100} step={0.1} onChange={(v) => update({ cap: v })} />
        <p className="mt-3 text-xs text-slate-500">In astable mode the 555 oscillates on its own, charging the capacitor through R1+R2 and discharging through R2. Frequency f = 1.44 / ((R1+2R2)·C), and the duty cycle always exceeds 50% for this classic circuit. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Frequency" value={`${f.toFixed(1)} Hz`} />
        <Stat label="Duty cycle" value={`${(duty * 100).toFixed(0)}%`} />
        <Stat label="High time" value={`${(thigh * 1000).toFixed(2)} ms`} />
        <Stat label="Low time" value={`${(tlow * 1000).toFixed(2)} ms`} />
        <Equation tex={`f = \\frac{1.44}{(R_1+2R_2)\\,C} = ${f.toFixed(1)}\\ \\text{Hz},\\quad D = \\frac{R_1+R_2}{R_1+2R_2} = ${(duty * 100).toFixed(0)}\\%`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
