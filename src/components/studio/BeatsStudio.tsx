"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 440;

const PRESETS: Record<string, { f1: number; f2: number }> = {
  "In tune (no beat)": { f1: 10, f2: 10 },
  "Slow beat": { f1: 10, f2: 10.5 },
  "Wobble tuning": { f1: 12, f2: 12.5 },
  "Wide dissonance": { f1: 7, f2: 13 },
};

export function BeatsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ f1, f2 }, update] = useShareableNumbers({ f1: 10, f2: 11 });

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const pad = 30;
    const wave = (fn: (x: number) => number, color: string, midY: number, amp: number, lw: number) => { ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath(); for (let px = pad; px <= W - pad; px++) { const x = (px - pad) / (W - 2 * pad) * 4 * Math.PI; const y = midY - amp * fn(x); px === pad ? ctx.moveTo(px, y) : ctx.lineTo(px, y); } ctx.stroke(); };
    wave((x) => Math.sin(f1 * x), "rgba(34,211,238,0.35)", 90, 40, 1);
    wave((x) => Math.sin(f2 * x), "rgba(163,230,53,0.35)", 90, 40, 1);
    wave((x) => Math.sin(f1 * x) + Math.sin(f2 * x), "#e2e8f0", 300, 70, 2);
    // envelope
    ctx.strokeStyle = "rgba(244,114,182,0.7)"; ctx.setLineDash([4, 4]);
    for (const s of [1, -1]) { ctx.beginPath(); for (let px = pad; px <= W - pad; px++) { const x = (px - pad) / (W - 2 * pad) * 4 * Math.PI; const env = s * 2 * 70 * Math.abs(Math.cos((f2 - f1) / 2 * x)); px === pad ? ctx.moveTo(px, 300 - env) : ctx.lineTo(px, 300 - env); } ctx.stroke(); } ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("two tones (top) → sum with beat envelope (bottom)", 14, 22);
  }, [f1, f2]);

  const beat = Math.abs(f2 - f1);
  const carrier = (f1 + f2) / 2;
  const explain = beat === 0
    ? `Both tones are identical, so there is no beat — the amplitude holds steady and the ear hears one pure ${carrier.toFixed(1)} Hz pitch.`
    : beat < 1
    ? `The sound swells and fades ${beat.toFixed(1)} times per second (the beat = |f₂−f₁|) while the ear hears the average ${carrier.toFixed(1)} Hz pitch — slow enough that a musician tunes by shrinking this throb toward zero.`
    : `At a ${beat.toFixed(1)} Hz beat the throb is too fast to count as a pulse; the ear stops hearing separate beats and instead hears roughness or dissonance around the ${carrier.toFixed(1)} Hz average pitch.`;

  const code = `import numpy as np
f1, f2 = ${f1}, ${f2}
t = np.linspace(0, 4*np.pi, 2000)
y = np.sin(f1*t) + np.sin(f2*t)   # superposition
beat = abs(f2 - f1)               # amplitude throbs at the difference
carrier = (f1 + f2) / 2           # perceived pitch = average
print("beat Hz", beat, "| carrier", carrier)`;

  return (
    <StudioChrome title="Beats & Superposition" tagline="two close frequencies interfere"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Two tones close in frequency add to a wave whose amplitude throbs at the difference frequency — the beats a musician hears when tuning.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Frequency 1" value={f1} min={5} max={20} step={0.5} onChange={(v) => update({ f1: v })} />
        <Slider label="Frequency 2" value={f2} min={5} max={20} step={0.5} onChange={(v) => update({ f2: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="f₁, f₂" value={`${f1}, ${f2}`} /><Stat label="Beat frequency" value={beat.toFixed(1)} /><Stat label="Effect" value="amplitude throb" /><Equation tex={`f_{\\text{beat}} = |f_2 - f_1| = |${f2} - ${f1}| = ${beat.toFixed(1)}\\ \\text{Hz}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
