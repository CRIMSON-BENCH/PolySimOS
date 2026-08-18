"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";
import { Equation } from "./Equation";

const PRESETS: Record<string, { a: number; b: number; T: number }> = {
  "CO₂ (warm)": { a: 3.64, b: 0.0427, T: 320 },
  "Water vapor": { a: 5.5, b: 0.031, T: 400 },
  "Helium (ideal-like)": { a: 0.035, b: 0.024, T: 300 },
  "Near-critical": { a: 1.4, b: 0.039, T: 180 },
};

export function VanDerWaalsStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ a, b, T }, update] = useShareableNumbers({ a: 1.4, b: 0.039, T: 320 });
  const R = 0.08314; // L·bar/(mol·K)
  const Pvdw = (V: number) => R * T / (V - b) - a / (V * V);
  const Pideal = (V: number) => R * T / V;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55, Vmin = b + 0.02, Vmax = 1.2, Pmax = 120;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const plot = (f: (V: number) => number, col: string) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); let started = false; for (let i = 0; i <= pw; i++) { const V = Vmin + (Vmax - Vmin) * i / pw; const P = f(V); if (P < 0 || P > Pmax) { started = false; continue; } const x = ox + i, y = oy - (P / Pmax) * ph; started ? ctx.lineTo(x, y) : ctx.moveTo(x, y); started = true; } ctx.stroke(); };
    plot(Pideal, "#64748b"); plot(Pvdw, "#22d3ee");
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("P–V isotherm · ideal (grey) vs van der Waals (cyan)", ox + 6, oy - ph + 12); ctx.fillText("volume →", ox + pw - 54, oy + 18);
  }, [a, b, T]);

  const dev = (Pvdw(0.3) / Pideal(0.3) - 1) * 100;
  const explain =
    dev < -20
      ? `Strong attraction (a = ${a}) pulls molecules together, so the real pressure sits ${Math.abs(dev).toFixed(0)}% below the ideal-gas prediction — the gas is heading toward condensation.`
      : dev > 20
      ? `Finite molecular size (b = ${b}) dominates here: excluded volume pushes the real pressure ${dev.toFixed(0)}% above the ideal-gas curve.`
      : T < 220
      ? `At ${T} K the isotherm begins to loop, the tell-tale van der Waals signature of a liquid–gas transition below the critical temperature.`
      : `At ${T} K the a and b corrections nearly cancel, so the real gas tracks the ideal-gas law to within ${Math.abs(dev).toFixed(0)}%.`;

  const code = `import numpy as np
a, b, T = ${a}, ${b}, ${T}
R = 0.08314  # L·bar/(mol·K)
V = np.linspace(b + 0.02, 1.2, 400)
P_vdw = R * T / (V - b) - a / V**2
P_ideal = R * T / V
print("P_vdw at V=0.3:", R * T / (0.3 - b) - a / 0.3**2)`;

  return (
    <StudioChrome title="Van der Waals Real Gas" tagline="where the ideal gas law breaks"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Attraction a (L²·bar/mol²)" value={a} min={0} max={6} step={0.1} onChange={(v) => update({ a: v })} />
        <Slider label="Volume b (L/mol)" value={b} min={0.01} max={0.1} step={0.005} onChange={(v) => update({ b: v })} />
        <Slider label="Temperature (K)" value={T} min={150} max={500} step={5} onChange={(v) => update({ T: v })} />
        <p className="mt-3 text-xs text-slate-500">Real gases deviate from PV = nRT because molecules attract each other (the a term) and occupy volume (the b term). Van der Waals adds both corrections, and below the critical temperature the isotherm even loops — predicting condensation. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="P at V=0.3 L (vdW)" value={`${Pvdw(0.3).toFixed(1)} bar`} />
        <Stat label="P at V=0.3 L (ideal)" value={`${Pideal(0.3).toFixed(1)} bar`} />
        <Stat label="Deviation" value={`${dev.toFixed(0)}%`} />
        <Equation tex={`\\left(P + \\frac{a}{V^2}\\right)(V - b) = RT, \\quad a=${a},\\ b=${b},\\ RT=${(R * T).toFixed(2)}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
