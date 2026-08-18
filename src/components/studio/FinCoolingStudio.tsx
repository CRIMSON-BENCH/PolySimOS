"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { k: number; h: number; t: number; L: number; Tb: number }> = {
  "Aluminum CPU fin": { k: 200, h: 50, t: 0.003, L: 0.05, Tb: 100 },
  "Copper heat sink": { k: 400, h: 100, t: 0.002, L: 0.03, Tb: 90 },
  "Steel fin (poor)": { k: 15, h: 50, t: 0.003, L: 0.1, Tb: 120 },
  "Natural convection": { k: 200, h: 10, t: 0.004, L: 0.05, Tb: 80 },
};

export function FinCoolingStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ k, h, t, L, Tb }, update] = useShareableNumbers({ k: 200, h: 50, t: 0.003, L: 0.05, Tb: 100 });
  const Tinf = 25;
  const m = Math.sqrt(2 * h / (k * t));
  const theta = (x: number) => Math.cosh(m * (L - x)) / Math.cosh(m * L);
  const eff = Math.tanh(m * L) / (m * L);
  const Ttip = Tinf + (Tb - Tinf) * theta(L);
  const q = Math.sqrt(2 * h * k * t) * (Tb - Tinf) * Math.tanh(m * L);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const y = H / 2, len = W - 80;
    for (let i = 0; i < len; i++) { const x = i / len * L; const T = Tinf + (Tb - Tinf) * theta(x); const c01 = (T - Tinf) / (Tb - Tinf); ctx.fillStyle = `rgb(${Math.round(60 + c01 * 195)},${Math.round(90 + (1 - c01) * 120)},${Math.round(160 - c01 * 100)})`; ctx.fillRect(40 + i, y - 26, 1, 52); }
    ctx.strokeStyle = "#334155"; ctx.strokeRect(40, y - 26, len, 52);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`base ${Tb}°C`, 44, y - 34); ctx.fillText(`tip ${Ttip.toFixed(0)}°C`, 40 + len - 50, y - 34); ctx.fillText("heat conducts out along the fin, convects to air", 40, H - 16);
  }, [k, h, t, L, Tb, m]);

  const mL = m * L;
  const explain =
    eff > 0.9
      ? `Short, thick, conductive fin (mL=${mL.toFixed(2)}): nearly the whole surface stays near base temperature, so efficiency is ${(eff * 100).toFixed(0)}% — adding length here would still buy real cooling.`
      : eff < 0.5
      ? `Long or low-conductivity fin (mL=${mL.toFixed(2)}): the tip has already cooled to near air temperature, so the far half sheds little heat — efficiency is only ${(eff * 100).toFixed(0)}%.`
      : `Balanced fin (mL=${mL.toFixed(2)}): a practical compromise at ${(eff * 100).toFixed(0)}% efficiency, with the tip still ${(Ttip - Tinf).toFixed(0)} °C above ambient.`;

  const code = `import numpy as np
k, h, t, L, Tb, Tinf = ${k}, ${h}, ${t}, ${L}, ${Tb}, 25
m = np.sqrt(2*h/(k*t))
eff = np.tanh(m*L)/(m*L)                    # fin efficiency
q = np.sqrt(2*h*k*t)*(Tb-Tinf)*np.tanh(m*L) # heat dissipated (W)
Ttip = Tinf + (Tb-Tinf)/np.cosh(m*L)
print("eff", round(eff, 3), "q_W", round(q, 2), "Ttip_C", round(Ttip, 1))`;

  return (
    <StudioChrome title="Fin Cooling" tagline="heat sinks & extended surfaces"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Conductivity k (W/m·K)" value={k} min={15} max={400} step={5} onChange={(v) => update({ k: v })} />
        <Slider label="Convection h (W/m²·K)" value={h} min={5} max={200} step={5} onChange={(v) => update({ h: v })} />
        <Slider label="Fin thickness (m)" value={t} min={0.001} max={0.01} step={0.001} onChange={(v) => update({ t: v })} />
        <Slider label="Fin length (m)" value={L} min={0.01} max={0.15} step={0.005} onChange={(v) => update({ L: v })} />
        <Slider label="Base temp (°C)" value={Tb} min={40} max={150} step={5} onChange={(v) => update({ Tb: v })} />
        <p className="mt-3 text-xs text-slate-500">A fin extends a hot surface into the air to shed more heat. Temperature falls along it as θ(x)/θ_b = cosh(m(L−x))/cosh(mL). Long, thin, low-conductivity fins run cool at the tip — wasted area, captured by the fin efficiency. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Tip temperature" value={`${Ttip.toFixed(1)} °C`} />
        <Stat label="Fin efficiency" value={`${(eff * 100).toFixed(0)}%`} />
        <Stat label="Heat dissipated" value={`${q.toFixed(1)} W`} />
        <Equation tex={`\\frac{\\theta}{\\theta_b} = \\frac{\\cosh(${m.toFixed(1)}\\,(${L}-x))}{\\cosh(${mL.toFixed(2)})},\\quad m=\\sqrt{\\frac{2h}{kt}}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
