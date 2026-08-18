"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { N0: number; K: number; b: number }> = {
  "Fast & small": { N0: 5, K: 800, b: 0.15 },
  "Slow & large": { N0: 1, K: 4000, b: 0.03 },
  "Aggressive": { N0: 20, K: 5000, b: 0.2 },
  "Indolent": { N0: 10, K: 1500, b: 0.02 },
};

export function TumorGrowthStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ N0, K, b }, update] = useShareableNumbers({ N0: 1, K: 1000, b: 0.05 });
  const [model, setModel] = useState(0);
  const gompertz = (t: number) => K * Math.exp(Math.log(N0 / K) * Math.exp(-b * t));
  const logistic = (t: number) => K / (1 + (K / N0 - 1) * Math.exp(-b * 4 * t));
  const f = model ? logistic : gompertz;
  const days = 200; const halfT = (() => { for (let t = 0; t < days; t++) if (f(t) >= K / 2) return t; return days; })();

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 32, pw = W - 65, ph = H - 52;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(ox, oy - ph * 0.95); ctx.lineTo(ox + pw, oy - ph * 0.95); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const t = days * i / pw; const y = oy - (f(t) / K) * ph * 0.95; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`${model ? "logistic" : "Gompertz"} tumor growth toward carrying capacity`, ox + 6, oy - ph + 12); ctx.fillText("days →", ox + pw - 44, oy + 18);
  }, [N0, K, b, model, f]);

  const explain = `The ${model ? "logistic" : "Gompertz"} curve reaches half of its ${K}-cell ceiling around day ${halfT}; ${
    b >= 0.12
      ? "the high growth rate makes early expansion steep before it saturates."
      : b <= 0.03
      ? "the low growth rate keeps the tumor small through a long lag before it accelerates."
      : "growth is fastest early on and flattens as it nears carrying capacity."
  }`;

  const code = `import numpy as np
N0, K, b, model = ${N0}, ${K}, ${b}, ${model}   # model: 0=Gompertz, 1=logistic
def f(t):
    if model: return K/(1 + (K/N0 - 1)*np.exp(-b*4*t))
    return K*np.exp(np.log(N0/K)*np.exp(-b*t))
for t in [0, 25, 50, 100, 200]:
    print(t, round(f(t)))`;

  return (
    <StudioChrome title="Tumor Growth" tagline="Gompertz & logistic dynamics"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <label className="mb-2 block text-xs text-slate-400">Model</label>
        <select value={model} onChange={(e) => setModel(Number(e.target.value))} className="mb-3 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><option value={0}>Gompertz</option><option value={1}>Logistic</option></select>
        <Slider label="Initial size N₀" value={N0} min={1} max={100} step={1} onChange={(v) => update({ N0: v })} />
        <Slider label="Carrying capacity K" value={K} min={100} max={5000} step={100} onChange={(v) => update({ K: v })} />
        <Slider label="Growth rate b" value={b} min={0.01} max={0.2} step={0.01} onChange={(v) => update({ b: v })} />
        <p className="mt-3 text-xs text-slate-500">Tumors do not grow exponentially forever — they slow as they outstrip their blood supply. Gompertz and logistic models both bend toward a carrying capacity, with growth fastest early on. This shape guides how treatments are timed. Educational tool, not medical advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Size at day 100" value={`${f(100).toFixed(0)}`} />
        <Stat label="Time to half-max" value={`${halfT} days`} />
        <Stat label="Carrying capacity" value={`${K}`} />
        <Equation tex={model ? `\\frac{dV}{dt}=rV\\left(1-\\frac{V}{K}\\right),\\quad K=${K}` : `\\frac{dV}{dt}=bV\\ln\\!\\frac{K}{V},\\quad b=${b},\\ K=${K}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
