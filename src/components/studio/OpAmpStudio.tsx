"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

type Cfg = "inverting" | "noninverting" | "difference" | "integrator";

const PRESETS: Record<string, { R1: number; R2: number; vin: number }> = {
  "×10 amplifier": { R1: 10, R2: 100, vin: 1 },
  "Modest ×2": { R1: 100, R2: 100, vin: 2 },
  "High gain (clips)": { R1: 2, R2: 200, vin: 1 },
  "Line level": { R1: 22, R2: 47, vin: 0.5 },
};

export function OpAmpStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cfg, setCfg] = useState<Cfg>("inverting");
  const [{ R1, R2, vin }, update] = useShareableNumbers({ R1: 10, R2: 100, vin: 1 });

  const gain = cfg === "inverting" ? -R2 / R1 : cfg === "noninverting" ? 1 + R2 / R1 : cfg === "difference" ? R2 / R1 : 0;
  const vout = cfg === "integrator" ? 0 : gain * vin;
  const clipped = Math.abs(vout) > 12;

  useEffect(() => {
    const W = 540, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 30, mid = H / 2 - 40;
    // waveforms
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, mid); ctx.lineTo(W - 20, mid); ctx.stroke();
    const drawWave = (amp: number, col: string, intg: boolean) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= W - 50; i++) { const t = (i / (W - 50)) * 4 * Math.PI; let v = intg ? -amp * Math.cos(t) / 2 : amp * Math.sin(t); v = Math.max(-12, Math.min(12, v)); const y = mid - v * 6; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke(); };
    drawWave(vin, "#64748b", false);
    drawWave(cfg === "integrator" ? vin * 2 : vout, cfg === "integrator" ? "#22d3ee" : "#22d3ee", cfg === "integrator");
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("input (gray)  ·  output (cyan)", ox, H - 40); if (clipped) { ctx.fillStyle = "#f87171"; ctx.fillText("output clipping at ±12V rail", ox, H - 22); }
  }, [cfg, R1, R2, vin]);

  const explain = cfg === "integrator"
    ? "In integrator mode the output is the running integral of the input, so a sine wave becomes a phase-shifted cosine — the circuit accumulates area under the curve."
    : clipped
    ? `A gain of ${gain.toFixed(1)}× drives the output past the ±12 V rail, so the peaks flatten off (clipping). Lower the gain or the input to stay linear.`
    : cfg === "inverting"
    ? `Inverting gain is −R2/R1 = ${gain.toFixed(2)}×: the output is a scaled, flipped copy of the input, set entirely by the resistor ratio.`
    : cfg === "noninverting"
    ? `Non-inverting gain is 1 + R2/R1 = ${gain.toFixed(2)}×, always at least 1 and in phase with the input.`
    : `Difference gain is R2/R1 = ${gain.toFixed(2)}×, amplifying only the difference between the two inputs and rejecting what they share.`;

  const code = `# Ideal op-amp gain
cfg = "${cfg}"
R1, R2, vin = ${R1}, ${R2}, ${vin}  # kOhm, kOhm, V
gain = {"inverting": -R2/R1, "noninverting": 1+R2/R1, "difference": R2/R1, "integrator": 0}[cfg]
vout = max(-12, min(12, gain*vin))
print("gain", gain, "vout", vout)`;

  return (
    <StudioChrome title="Op-Amp Circuits" tagline="ideal amplifier configurations"
      controls={<div>
        <div className="mb-3 grid grid-cols-2 gap-2">{(["inverting", "noninverting", "difference", "integrator"] as Cfg[]).map((c) => <button key={c} onClick={() => setCfg(c)} className={`rounded-lg px-1 py-1 text-xs font-semibold capitalize ${cfg === c ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{c}</button>)}</div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Input R1 (kΩ)" value={R1} min={1} max={100} step={1} onChange={(v) => update({ R1: v })} />
        <Slider label="Feedback R2 (kΩ)" value={R2} min={1} max={500} step={1} onChange={(v) => update({ R2: v })} />
        <Slider label="Input amplitude (V)" value={vin} min={0.1} max={5} step={0.1} onChange={(v) => update({ vin: v })} />
        <p className="mt-3 text-xs text-slate-500">The op-amp is the fundamental building block of analog electronics. With negative feedback, its gain is set entirely by external resistors: an inverting amp gives −R2/R1, a non-inverting amp 1+R2/R1. An integrator uses a feedback capacitor to output the running integral of its input.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Configuration" value={cfg} /><Stat label="Gain" value={cfg === "integrator" ? "∫ dt" : `${gain.toFixed(2)}×`} /><Stat label="Output" value={cfg === "integrator" ? "integral" : `${vout.toFixed(2)} V`} /><Stat label="Status" value={clipped ? "clipping" : "linear"} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
