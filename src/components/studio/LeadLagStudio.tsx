"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { zero: number; pole: number }> = {
  "Phase lead": { zero: 1, pole: 10 },
  "Strong lead": { zero: 2, pole: 50 },
  "Phase lag": { zero: 10, pole: 1 },
  "Mild lag": { zero: 20, pole: 5 },
};

export function LeadLagStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ zero, pole }, update] = useShareableNumbers({ zero: 1, pole: 10 });
  // C(s) = (1 + s/zero)/(1 + s/pole). lead if pole>zero (phase boost), lag if pole<zero
  const phase = (w: number) => (Math.atan(w / zero) - Math.atan(w / pole)) * 180 / Math.PI;
  let maxPhase = 0, wAtMax = 0; for (let i = 0; i < 400; i++) { const w = Math.pow(10, -2 + 5 * i / 400); const ph = phase(w); if (Math.abs(ph) > Math.abs(maxPhase)) { maxPhase = ph; wAtMax = w; } }

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H / 2 + 40, pw = W - 60, ph = H / 2, wmin = 0.01, wmax = 1000;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy - ph); ctx.lineTo(ox, oy + ph); ctx.stroke();
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const w = wmin * Math.pow(wmax / wmin, i / pw); const y = oy - (phase(w) / 90) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("compensator phase vs frequency (log)", ox + 6, 22); ctx.fillText(pole > zero ? "lead (phase boost)" : "lag (phase drop)", ox + 6, 40);
  }, [zero, pole]);

  const explain =
    pole > zero
      ? `Pole above zero makes this a lead network: it injects up to ${maxPhase.toFixed(0)}° of phase near ${wAtMax.toFixed(1)} rad/s, widening the stability margin and speeding the response right where the loop crosses over.`
      : pole < zero
      ? `Pole below zero makes this a lag network: it sheds up to ${Math.abs(maxPhase).toFixed(0)}° of phase to buy low-frequency gain, shrinking steady-state error at the cost of some bandwidth.`
      : "With the pole and zero equal the two effects cancel, so the compensator is flat — no phase shaping at any frequency.";
  const code = `import numpy as np
zero, pole = ${zero}, ${pole}
w = np.logspace(-2, 3, 400)
phase = np.degrees(np.arctan(w / zero) - np.arctan(w / pole))
i = np.argmax(np.abs(phase))
print("max phase", phase[i], "deg at", w[i], "rad/s")`;
  return (
    <StudioChrome title="Lead–Lag Compensator" tagline="shaping phase for stability"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Zero (rad/s)" value={zero} min={0.1} max={50} step={0.1} onChange={(v) => update({ zero: v })} />
        <Slider label="Pole (rad/s)" value={pole} min={0.1} max={100} step={0.1} onChange={(v) => update({ pole: v })} />
        <p className="mt-3 text-xs text-slate-500">A lead compensator (pole above zero) adds phase near the crossover to boost stability margins and speed; a lag compensator (pole below zero) trades phase to raise low-frequency gain and kill steady-state error. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Type" value={pole > zero ? "lead" : pole < zero ? "lag" : "none"} />
        <Stat label="Max phase shift" value={`${maxPhase.toFixed(0)}°`} />
        <Stat label="At frequency" value={`${wAtMax.toFixed(2)} rad/s`} />
        <Equation tex={`C(s) = \\dfrac{1 + s/${zero.toFixed(1)}}{1 + s/${pole.toFixed(1)}}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
