"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { r: number; K: number; N0: number }> = {
  "Slow growth": { r: 0.2, K: 1000, N0: 20 },
  "Fast to carrying capacity": { r: 1.5, K: 1000, N0: 20 },
  "Near capacity": { r: 0.5, K: 1000, N0: 450 },
  "Steep S-curve": { r: 2, K: 1500, N0: 10 },
};

export function LogisticGrowthStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ r, K, N0 }, update] = useShareableNumbers({ r: 0.5, K: 1000, N0: 20 });

  useEffect(() => {
    const W = 540, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 30, pw = W - 65, ph = H - 50; const days = 40; const dt = 0.05;
    let Nl = N0, Ne = N0; const log: number[] = [Nl], exp: number[] = [Ne];
    for (let t = 0; t < days / dt; t++) { Nl += r * Nl * (1 - Nl / K) * dt; Ne += r * Ne * dt; if (t % 4 === 0) { log.push(Nl); exp.push(Math.min(Ne, K * 2)); } }
    const yMax = K * 1.3;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // carrying capacity line
    ctx.strokeStyle = "#475569"; ctx.setLineDash([5, 4]); const ky = oy - (K / yMax) * ph; ctx.beginPath(); ctx.moveTo(ox, ky); ctx.lineTo(ox + pw, ky); ctx.stroke(); ctx.setLineDash([]);
    const plot = (arr: number[], col: string) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); arr.forEach((v, i) => { const x = ox + (i / arr.length) * pw; const y = oy - (Math.min(v, yMax) / yMax) * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); };
    plot(exp, "#f472b6"); plot(log, "#22d3ee");
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("K (carrying capacity)", ox + pw - 130, ky - 5); ctx.fillStyle = "#22d3ee"; ctx.fillText("logistic", ox + 8, oy - ph + 14); ctx.fillStyle = "#f472b6"; ctx.fillText("exponential", ox + 60, oy - ph + 14);
  }, [r, K, N0]);

  const half = K / 2;
  const explain =
    N0 >= half
      ? `Starting at N₀=${N0}, the population begins above the inflection point K/2=${half.toFixed(0)}, so it never accelerates — growth only decelerates as it eases up toward the carrying capacity K=${K}.`
      : r >= 1.2
      ? `With a high growth rate r=${r.toFixed(2)}, the population rockets through the inflection point at K/2=${half.toFixed(0)} and locks onto the carrying capacity K=${K} within a few time units — a steep S-curve.`
      : r <= 0.3
      ? `A low growth rate r=${r.toFixed(2)} means a gentle, drawn-out climb: the population creeps toward K=${half > N0 ? "the carrying capacity" : `${K}`} and reaches its steepest slope only when it passes the inflection point N=K/2=${half.toFixed(0)}.`
      : `Classic S-curve: from N₀=${N0} the population grows fastest as it crosses the inflection point N=K/2=${half.toFixed(0)}, then decelerates and levels off at the carrying capacity K=${K}.`;

  const code = `import numpy as np
from scipy.integrate import odeint
r, K, N0 = ${r}, ${K}, ${N0}
def dPdt(P, t): return r * P * (1 - P / K)
t = np.linspace(0, 40, 800)
P = odeint(dPdt, N0, t)[:, 0]
print("final", P[-1], "inflection at N =", K / 2)`;

  return (
    <StudioChrome title="Logistic Population Growth" tagline="growth with a ceiling"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Growth rate r" value={r} min={0.05} max={2} step={0.05} onChange={(v) => update({ r: v })} />
        <Slider label="Carrying capacity K" value={K} min={100} max={2000} step={50} onChange={(v) => update({ K: v })} />
        <Slider label="Initial population N₀" value={N0} min={1} max={500} step={1} onChange={(v) => update({ N0: v })} />
        <p className="mt-3 text-xs text-slate-500">Exponential growth assumes unlimited resources and explodes without bound. Logistic growth adds a carrying capacity K: as the population nears K, growth slows and levels off in a characteristic S-curve. It is the foundation of ecology, epidemiology, and resource management.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Carrying capacity" value={String(K)} /><Stat label="Max growth at" value={`N = ${(K / 2).toFixed(0)}`} /><Stat label="Growth rate r" value={r.toFixed(2)} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
