"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { Ea: number; logA: number; T: number }> = {
  "Room temp": { Ea: 50, logA: 11, T: 298 },
  "Body-temp enzyme": { Ea: 25, logA: 11, T: 310 },
  "High barrier": { Ea: 150, logA: 13, T: 298 },
  "Combustion (hot)": { Ea: 100, logA: 13, T: 400 },
};

export function ArrheniusRateStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ Ea, logA, T }, update] = useShareableNumbers({ Ea: 50, logA: 11, T: 298 });
  const A = Math.pow(10, logA);
  const k = (temp: number) => A * Math.exp(-Ea * 1000 / (8.314 * temp));
  const kNow = k(T), kUp = k(T + 10);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 48, oy = H - 35, pw = W - 68, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // ln k vs 1/T (Arrhenius plot) — straight line
    const t1 = 250, t2 = 400; const x = (temp: number) => ox + ((1 / temp - 1 / t2) / (1 / t1 - 1 / t2)) * pw;
    let lnMin = Math.log(k(t1)), lnMax = Math.log(k(t2)); if (lnMin > lnMax) { const tmp = lnMin; lnMin = lnMax; lnMax = tmp; }
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= pw; i++) { const invT = (1 / t1) + ((1 / t2) - (1 / t1)) * i / pw; const temp = 1 / invT; const y = oy - ((Math.log(k(temp)) - lnMin) / (lnMax - lnMin || 1)) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    const py = oy - ((Math.log(kNow) - lnMin) / (lnMax - lnMin || 1)) * ph; ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(x(T), py, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("Arrhenius plot: ln k vs 1/T (slope = −Ea/R)", ox + 6, oy - ph + 12); ctx.fillText("1/T →", ox + pw - 40, oy + 18);
  }, [Ea, logA, T, kNow]);

  const speedup = kUp / kNow;
  const explain =
    Ea < 40
      ? `A low barrier (${Ea} kJ/mol) means most collisions already succeed, so warming +10 K only speeds things ${speedup.toFixed(1)}× — the reaction is relatively temperature-insensitive.`
      : Ea > 120
      ? `A steep barrier (${Ea} kJ/mol) makes the rate hypersensitive to heat: +10 K here multiplies it ${speedup.toFixed(1)}×, because the exp(−Ea/RT) term dominates.`
      : `At ${T} K the +10 K speed-up is ${speedup.toFixed(1)}× — the barrier Ea sets the slope −Ea/R of the straight Arrhenius line, so higher Ea tilts it steeper and heat matters more.`;

  const code = `import numpy as np
Ea, logA, T = ${Ea}, ${logA}, ${T}  # kJ/mol, log10(A), K
A = 10**logA; R = 8.314
k = lambda temp: A * np.exp(-Ea*1000 / (R*temp))
print("k", k(T), "  speed-up per +10 K", k(T+10)/k(T))`;

  return (
    <StudioChrome title="Arrhenius Reaction Rate" tagline="why heat speeds up reactions"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Activation energy Ea (kJ/mol)" value={Ea} min={10} max={200} step={5} onChange={(v) => update({ Ea: v })} />
        <Slider label="log₁₀ pre-factor A" value={logA} min={6} max={15} step={0.5} onChange={(v) => update({ logA: v })} />
        <Slider label="Temperature (K)" value={T} min={250} max={400} step={1} onChange={(v) => update({ T: v })} />
        <p className="mt-3 text-xs text-slate-500">Reactions speed up with temperature because more molecules clear the activation-energy barrier. The Arrhenius law k = A·exp(−Ea/RT) captures this — plotting ln k against 1/T gives a straight line whose slope reveals Ea. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Rate constant k" value={kNow.toExponential(2)} />
        <Stat label="k at T + 10 K" value={kUp.toExponential(2)} />
        <Stat label="Speed-up per +10 K" value={`${speedup.toFixed(1)}×`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
