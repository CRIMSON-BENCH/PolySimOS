"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { K: number; p1: number; p2: number }> = {
  "Well-damped": { K: 1, p1: 1, p2: 10 },
  "High gain (low margin)": { K: 15, p1: 1, p2: 10 },
  "Wide pole split": { K: 1, p1: 0.5, p2: 100 },
  "Close poles": { K: 1, p1: 2, p2: 3 },
};

export function BodeNyquistStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ K, p1, p2 }, update] = useShareableNumbers({ K: 1, p1: 1, p2: 10 });
  // G = K / ((1+s/p1)(1+s/p2))
  const magdb = (w: number) => 20 * Math.log10(K / (Math.sqrt(1 + (w / p1) ** 2) * Math.sqrt(1 + (w / p2) ** 2)));
  const phase = (w: number) => -(Math.atan(w / p1) + Math.atan(w / p2)) * 180 / Math.PI;
  // gain crossover (mag=0dB)
  let wc = 0; for (let i = 0; i < 400; i++) { const w = Math.pow(10, -2 + 5 * i / 400); if (magdb(w) < 0) { wc = w; break; } }
  const pm = 180 + phase(wc);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, pw = W - 60, wmin = 0.01, wmax = 1000;
    const drawAxis = (oy: number, ph: number) => { ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy - ph); ctx.lineTo(ox, oy + ph); ctx.stroke(); };
    // magnitude (top)
    const oy1 = 90, ph1 = 60; drawAxis(oy1, ph1);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const w = wmin * Math.pow(wmax / wmin, i / pw); const y = oy1 - Math.max(-ph1, Math.min(ph1, magdb(w) / 60 * ph1)); i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("magnitude (dB)", ox + 6, 24);
    // phase (bottom)
    const oy2 = 240, ph2 = 60; drawAxis(oy2, ph2);
    ctx.strokeStyle = "#f472b6"; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const w = wmin * Math.pow(wmax / wmin, i / pw); const y = oy2 - (phase(w) / 180) * ph2; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.fillText("phase (°) — frequency (log) →", ox + 6, 176);
  }, [K, p1, p2]);

  const explain =
    pm <= 0
      ? "Negative phase margin: closing the loop would oscillate and grow — this design is unstable as drawn."
      : pm < 30
      ? `Phase margin is only ${pm.toFixed(0)}° — technically stable but lightly damped, so expect overshoot and ringing. Lower the gain K or spread the poles.`
      : pm > 60
      ? `A healthy ${pm.toFixed(0)}° phase margin means the loop closes with plenty of stability and little overshoot.`
      : `Phase margin ${pm.toFixed(0)}° at the ${wc.toFixed(1)} rad/s crossover — a solid, well-behaved response; each pole adds up to 90° of lag as frequency climbs.`;

  const code = `import numpy as np
K, p1, p2 = ${K}, ${p1}, ${p2}
w = np.logspace(-2, 3, 400)
mag_db = 20 * np.log10(K / (np.hypot(1, w / p1) * np.hypot(1, w / p2)))
phase = -(np.arctan(w / p1) + np.arctan(w / p2)) * 180 / np.pi
wc = w[np.argmax(mag_db < 0)]
print("crossover", wc, "phase margin", 180 + phase[np.argmax(mag_db < 0)])`;

  return (
    <StudioChrome title="Bode Plot" tagline="magnitude & phase vs frequency"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Gain K" value={K} min={0.1} max={20} step={0.1} onChange={(v) => update({ K: v })} />
        <Slider label="Pole 1 (rad/s)" value={p1} min={0.1} max={10} step={0.1} onChange={(v) => update({ p1: v })} />
        <Slider label="Pole 2 (rad/s)" value={p2} min={1} max={100} step={1} onChange={(v) => update({ p2: v })} />
        <p className="mt-3 text-xs text-slate-500">A Bode plot shows how a system responds across frequencies: magnitude in decibels above, phase below. The gain and phase margins — how far the curves sit from instability at the crossover — predict whether closing the loop stays stable. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Gain crossover" value={`${wc.toFixed(2)} rad/s`} />
        <Stat label="Phase margin" value={`${pm.toFixed(0)}°`} />
        <Stat label="Stability" value={pm > 0 ? "stable ✓" : "marginal ⚠"} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
