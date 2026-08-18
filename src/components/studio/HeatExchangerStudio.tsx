"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { thi: number; tho: number; tci: number; UA: number }> = {
  "Steam heater": { thi: 150, tho: 90, tci: 20, UA: 2000 },
  "Water-to-water": { thi: 80, tho: 45, tci: 15, UA: 1000 },
  "Tight recuperator": { thi: 60, tho: 45, tci: 30, UA: 3000 },
  "Undersized (low UA)": { thi: 100, tho: 60, tci: 20, UA: 300 },
};

export function HeatExchangerStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ thi, tho, tci, UA }, update] = useShareableNumbers({ thi: 90, tho: 50, tci: 20, UA: 500 });
  const [counter, setCounter] = useState(1);
  // energy balance to get cold outlet from a chosen mass-flow-cp ratio ~ assume Cc from hot side balance with duty guess; simpler: fix tco via effectiveness-free LMTD demo
  const tco = tci + (thi - tho) * 0.8; // illustrative cold rise
  const dt1 = counter ? thi - tco : thi - tci;
  const dt2 = counter ? tho - tci : tho - tco;
  const lmtd = Math.abs(dt1 - dt2) < 0.01 ? dt1 : (dt1 - dt2) / Math.log(dt1 / dt2);
  const Q = UA * lmtd / 1000;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const y1 = 110, y2 = 210;
    ctx.fillStyle = "#334155"; ctx.fillRect(40, y1 - 18, W - 80, 36); ctx.fillRect(40, y2 - 18, W - 80, 36);
    const grad = (x: number, hot: number) => { const t = hot ? thi - (thi - tho) * x : (counter ? tco - (tco - tci) * x : tci + (tco - tci) * x); return t; };
    for (let i = 0; i < 40; i++) { const x = i / 40; const th = grad(x, 1), tc = grad(x, 0); const cx = 40 + x * (W - 80);
      ctx.fillStyle = `rgb(${Math.min(255, th * 2.6)},${80},${120})`; ctx.fillRect(cx, y1 - 16, (W - 80) / 40, 32);
      ctx.fillStyle = `rgb(${60},${Math.min(255, 120 + tc)},${220})`; ctx.fillRect(cx, y2 - 16, (W - 80) / 40, 32); }
    ctx.fillStyle = "#e2e8f0"; ctx.font = "11px sans-serif"; ctx.fillText(`hot ${thi}→${tho}°C`, 44, y1 - 24); ctx.fillText(`cold ${tci.toFixed(0)}→${tco.toFixed(0)}°C`, 44, y2 + 30); ctx.fillText(counter ? "counter-flow" : "parallel-flow", W - 150, 24);
  }, [thi, tho, tci, UA, counter, tco]);

  const explain = counter
    ? `Counter-flow holds the temperature gap open along the whole length, giving an LMTD near ${lmtd.toFixed(0)} K — that is why it out-duties parallel-flow for the same inlet temperatures.`
    : "Parallel-flow lets both streams converge toward one temperature, so the driving gap — and the heat duty — fade toward the far end.";

  const code = `import math
thi, tho, tci, UA = ${thi}, ${tho}, ${tci}, ${UA}
tco = tci + (thi - tho) * 0.8
counter = ${counter ? "True" : "False"}
dt1 = (thi - tco) if counter else (thi - tci)
dt2 = (tho - tci) if counter else (tho - tco)
lmtd = dt1 if abs(dt1 - dt2) < 1e-2 else (dt1 - dt2) / math.log(dt1 / dt2)
print("LMTD", lmtd, "Q_kW", UA * lmtd / 1000)`;

  return (
    <StudioChrome title="Heat Exchanger (LMTD)" tagline="counter-flow vs parallel-flow"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Hot inlet (°C)" value={thi} min={40} max={150} step={5} onChange={(v) => update({ thi: v })} />
        <Slider label="Hot outlet (°C)" value={tho} min={25} max={120} step={5} onChange={(v) => update({ tho: v })} />
        <Slider label="Cold inlet (°C)" value={tci} min={5} max={60} step={5} onChange={(v) => update({ tci: v })} />
        <Slider label="UA (W/K)" value={UA} min={100} max={3000} step={100} onChange={(v) => update({ UA: v })} />
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={!!counter} onChange={(e) => setCounter(e.target.checked ? 1 : 0)} /> Counter-flow arrangement</label>
        <p className="mt-3 text-xs text-slate-500">Heat exchanger duty Q = U·A·ΔT_lm, where the log-mean temperature difference (LMTD) accounts for how the temperature gap changes along the length. Counter-flow keeps the gap larger, transferring more heat. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="LMTD" value={`${lmtd.toFixed(1)} K`} />
        <Stat label="Heat duty Q" value={`${Q.toFixed(2)} kW`} />
        <Stat label="Arrangement" value={counter ? "counter-flow" : "parallel-flow"} />
        <Equation tex={`Q = ${UA}\\cdot\\Delta T_{lm},\\quad \\Delta T_{lm} = \\frac{${dt1.toFixed(1)} - ${dt2.toFixed(1)}}{\\ln(${dt1.toFixed(1)}/${dt2.toFixed(1)})} = ${lmtd.toFixed(1)}\\ \\text{K}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
