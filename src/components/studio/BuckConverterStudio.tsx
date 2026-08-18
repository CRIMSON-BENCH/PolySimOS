"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { vin: number; duty: number; L: number; fsw: number; iout: number }> = {
  "5V rail": { vin: 12, duty: 0.42, L: 100, fsw: 100, iout: 1 },
  "3.3V rail": { vin: 12, duty: 0.28, L: 100, fsw: 500, iout: 1 },
  "Low ripple": { vin: 12, duty: 0.42, L: 470, fsw: 1000, iout: 2 },
  "High current": { vin: 24, duty: 0.5, L: 47, fsw: 500, iout: 5 },
};

export function BuckConverterStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ vin, duty, L, fsw, iout }, update] = useShareableNumbers({ vin: 12, duty: 0.42, L: 100, fsw: 100, iout: 1 });
  const vout = duty * vin;
  const dIL = (vin - vout) * duty / (L * 1e-6 * fsw * 1000); // A
  const ripplePct = iout > 0 ? (dIL / iout) * 100 : 0;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const oy = H / 2 + 40, amp = 60, period = (W - 60) / 4;
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let cyc = 0; cyc < 4; cyc++) { const x0 = 30 + cyc * period; const on = period * duty; ctx.moveTo(x0, oy); ctx.lineTo(x0 + on, oy - amp); ctx.lineTo(x0 + period, oy + 0); }
    // inductor current triangle
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2; ctx.beginPath(); const iy = H / 2 - 20, ia = Math.min(50, ripplePct / 2);
    for (let cyc = 0; cyc < 4; cyc++) { const x0 = 30 + cyc * period; const on = period * duty; if (cyc === 0) ctx.moveTo(x0, iy + ia); ctx.lineTo(x0 + on, iy - ia); ctx.lineTo(x0 + period, iy + ia); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("switch node (cyan) · inductor current ripple (green)", 30, 24);
  }, [vin, duty, L, fsw, iout, ripplePct]);

  const explain =
    dIL / 2 > iout
      ? "Ripple now exceeds the load current, so the inductor empties each cycle (discontinuous mode) — raise L, switch faster, or draw more load to return to clean continuous conduction."
      : ripplePct > 40
      ? "Ripple is a large fraction of the load: the output voltage stays put but the inductor sees big swings — a bigger inductor or higher switching frequency tames it."
      : ripplePct < 15
      ? "Low ripple: the large inductor and fast switching keep current nearly flat, but that costs size and switching losses — this is the comfortable design zone."
      : "Vout tracks D·Vin regardless of load; the ripple you see is set by L and switching frequency, not by the output voltage itself.";

  const code = `vin, duty, L_uH, fsw_kHz, iout = ${vin}, ${duty}, ${L}, ${fsw}, ${iout}
vout = duty * vin
dIL = (vin - vout) * duty / (L_uH * 1e-6 * fsw_kHz * 1e3)   # inductor ripple, A
print("Vout", vout, "ripple A", dIL, "ripple %", dIL / iout * 100)`;

  return (
    <StudioChrome title="Buck Converter" tagline="step-down switching regulator"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Input Vin (V)" value={vin} min={5} max={48} step={1} onChange={(v) => update({ vin: v })} />
        <Slider label="Duty cycle D" value={duty} min={0.05} max={0.95} step={0.01} onChange={(v) => update({ duty: v })} />
        <Slider label="Inductor L (µH)" value={L} min={4.7} max={470} step={4.7} onChange={(v) => update({ L: v })} />
        <Slider label="Switching freq (kHz)" value={fsw} min={20} max={2000} step={20} onChange={(v) => update({ fsw: v })} />
        <Slider label="Load current (A)" value={iout} min={0.1} max={10} step={0.1} onChange={(v) => update({ iout: v })} />
        <p className="mt-3 text-xs text-slate-500">A buck converter chops the input at a fast switching frequency; the inductor and capacitor average it to a lower DC output, Vout = D·Vin. Bigger inductors and faster switching shrink the current ripple. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Output voltage" value={`${vout.toFixed(2)} V`} />
        <Stat label="Inductor ripple ΔIL" value={`${dIL.toFixed(2)} A`} />
        <Stat label="Ripple / load" value={`${ripplePct.toFixed(0)}%`} />
        <Stat label="Mode" value={dIL / 2 > iout ? "discontinuous" : "continuous"} />
        <Equation tex={`V_{out} = D \\cdot V_{in} = ${duty.toFixed(2)} \\cdot ${vin.toFixed(0)}\\,\\text{V} = ${vout.toFixed(2)}\\,\\text{V} \\qquad \\Delta I_L = \\frac{(V_{in}-V_{out})\\,D}{L\\,f_{sw}} = ${dIL.toFixed(2)}\\,\\text{A}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
