"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { D: number; L: number; Q: number; eps: number }> = {
  "Laminar (slow, narrow)": { D: 0.02, L: 50, Q: 0.001, eps: 0.001 },
  "Smooth water main": { D: 0.2, L: 200, Q: 0.05, eps: 0.0015 },
  "Rough cast iron": { D: 0.1, L: 100, Q: 0.02, eps: 0.26 },
  "High-flow turbulent": { D: 0.1, L: 50, Q: 0.08, eps: 0.045 },
};

export function PipeFlowStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ D, L, Q, eps }, update] = useShareableNumbers({ D: 0.1, L: 50, Q: 0.01, eps: 0.045 });
  const A = Math.PI * D * D / 4, v = Q / A, Re = v * D / 1e-6, rel = eps / 1000 / D;
  const f = Re < 2300 ? 64 / Re : 0.25 / Math.pow(Math.log10(rel / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
  const hf = f * (L / D) * v * v / (2 * 9.81), dp = 1000 * 9.81 * hf / 1000;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const py = H / 2, pr = Math.max(10, Math.min(60, D * 300));
    ctx.fillStyle = "#0e7490"; ctx.fillRect(30, py - pr, W - 60, pr * 2);
    ctx.strokeStyle = "#67e8f9"; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const x = 60 + i * 70; ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + 30, py); ctx.lineTo(x + 22, py - 6); ctx.moveTo(x + 30, py); ctx.lineTo(x + 22, py + 6); ctx.stroke(); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(Re < 2300 ? "laminar flow" : "turbulent flow", 34, 24); ctx.fillText(`pressure drops ${dp.toFixed(1)} kPa over ${L} m`, 34, H - 16);
  }, [D, L, Q, eps, Re, dp]);

  const explain =
    Re < 2300
      ? "Reynolds number below ~2300: the flow is laminar, so friction factor is simply 64/Re and pressure loss scales linearly with velocity."
      : Re < 4000
      ? "Reynolds number is in the transition band (2300–4000) — flow flickers between laminar and turbulent, so head-loss predictions are least reliable here."
      : rel > 0.01
      ? "Fully turbulent and rough-walled: the relative roughness dominates the Colebrook friction factor, so a smoother pipe would cut the pressure drop sharply."
      : "Fully turbulent in a relatively smooth pipe: friction factor depends weakly on Reynolds number, and head loss grows roughly with the square of flow rate.";

  const code = `import numpy as np
D, L, Q, eps = ${D}, ${L}, ${Q}, ${eps}  # m, m, m^3/s, mm
A = np.pi*D**2/4; v = Q/A; Re = v*D/1e-6; rel = eps/1000/D
if Re < 2300:
    f = 64/Re
else:
    f = 0.25/np.log10(rel/3.7 + 5.74/Re**0.9)**2  # Swamee-Jain
hf = f*(L/D)*v**2/(2*9.81); dp = 1000*9.81*hf/1000  # kPa
print("v", v, "Re", Re, "f", f, "head loss m", hf, "dp kPa", dp)`;

  return (
    <StudioChrome title="Pipe Flow & Head Loss" tagline="Darcy–Weisbach friction"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Diameter (m)" value={D} min={0.02} max={0.5} step={0.01} onChange={(x) => update({ D: x })} />
        <Slider label="Length (m)" value={L} min={5} max={500} step={5} onChange={(x) => update({ L: x })} />
        <Slider label="Flow rate (m³/s)" value={Q} min={0.001} max={0.1} step={0.001} onChange={(x) => update({ Q: x })} />
        <Slider label="Roughness ε (mm)" value={eps} min={0.001} max={3} step={0.001} onChange={(x) => update({ eps: x })} />
        <p className="mt-3 text-xs text-slate-500">Friction turns pressure into heat as fluid moves through a pipe. Head loss h_f = f·(L/D)·v²/2g, where the friction factor f depends on the Reynolds number and pipe roughness. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Velocity" value={`${v.toFixed(2)} m/s`} />
        <Stat label="Reynolds number" value={Re.toExponential(2)} />
        <Stat label="Friction factor f" value={f.toFixed(4)} />
        <Stat label="Head loss" value={`${hf.toFixed(2)} m`} />
        <Stat label="Pressure drop" value={`${dp.toFixed(1)} kPa`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
