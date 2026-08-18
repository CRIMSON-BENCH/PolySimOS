"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { r0: number; infPeriod: number; vacc: number }> = {
  "Seasonal flu (R₀≈1.3)": { r0: 1.3, infPeriod: 5, vacc: 0 },
  "COVID-19 (R₀≈3)": { r0: 3, infPeriod: 10, vacc: 0 },
  "Measles-like (R₀≈6)": { r0: 6, infPeriod: 8, vacc: 0 },
  "Herd immunity (60% vaccinated)": { r0: 2.5, infPeriod: 7, vacc: 0.6 },
};

export function SIRStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ r0, infPeriod, vacc }, update] = useShareableNumbers({ r0: 2.5, infPeriod: 7, vacc: 0 });
  const [peakI, setPeakI] = useState(0);
  const [totalInf, setTotalInf] = useState(0);

  useEffect(() => {
    const gamma = 1 / infPeriod; const beta = r0 * gamma; const days = 160; const dt = 0.1;
    let S = 1 - vacc - 1e-4, I = 1e-4, R = vacc; const S0 = S;
    const sArr: number[] = [], iArr: number[] = [], rArr: number[] = []; let pI = 0;
    for (let t = 0; t < days / dt; t++) {
      const dS = -beta * S * I, dI = beta * S * I - gamma * I, dR = gamma * I;
      S += dS * dt; I += dI * dt; R += dR * dt; pI = Math.max(pI, I);
      if (t % 5 === 0) { sArr.push(S); iArr.push(I); rArr.push(R); }
    }
    setPeakI(pI); setTotalInf(R - vacc);
    const W = 540, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 30, pw = W - 60, ph = H - 50;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const plot = (arr: number[], col: string) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); arr.forEach((v, i) => { const x = ox + (i / arr.length) * pw; const y = oy - v * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); };
    plot(sArr, "#22d3ee"); plot(iArr, "#f472b6"); plot(rArr, "#a3e635");
    ctx.font = "11px sans-serif"; ctx.fillStyle = "#22d3ee"; ctx.fillText("Susceptible", ox + 8, oy - ph + 14); ctx.fillStyle = "#f472b6"; ctx.fillText("Infected", ox + 90, oy - ph + 14); ctx.fillStyle = "#a3e635"; ctx.fillText("Recovered", ox + 150, oy - ph + 14);
    ctx.fillStyle = "#94a3b8"; ctx.fillText("time (days) →", ox + pw - 80, oy + 18); void S0;
  }, [r0, infPeriod, vacc]);

  const herd = 1 - 1 / r0;
  const effR0 = r0 * (1 - vacc);

  const explain =
    r0 <= 1
      ? `With R₀ = ${r0.toFixed(2)} ≤ 1, each case infects fewer than one other on average, so the outbreak dies out without an epidemic — no herd-immunity threshold is needed.`
      : vacc >= herd
      ? `R₀ = ${r0.toFixed(2)} would grow, but vaccinating ${(vacc * 100).toFixed(0)}% already meets the herd-immunity threshold of ${(herd * 100).toFixed(0)}% (1−1/R₀). The effective reproduction number drops to ${effR0.toFixed(2)} ≤ 1, so a major outbreak is prevented.`
      : `R₀ = ${r0.toFixed(2)} > 1 with only ${(vacc * 100).toFixed(0)}% immune, so infections grow into an epidemic. You would need to immunize ${(herd * 100).toFixed(0)}% (the herd-immunity threshold 1−1/R₀) to stop it; the current effective reproduction number is ${effR0.toFixed(2)}.`;

  const code = `import numpy as np
from scipy.integrate import odeint

r0, inf_period, vacc = ${r0}, ${infPeriod}, ${vacc}
gamma = 1 / inf_period
beta = r0 * gamma

def sir(y, t):
    S, I, R = y
    return [-beta*S*I, beta*S*I - gamma*I, gamma*I]

y0 = [1 - vacc - 1e-4, 1e-4, vacc]
t = np.linspace(0, 160, 1600)
S, I, R = odeint(sir, y0, t).T
print("peak infected", I.max(), "total infected", R[-1] - vacc)`;

  return (
    <StudioChrome title="SIR Epidemic Model" tagline="compartmental disease dynamics"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Basic reproduction R₀" value={r0} min={0.5} max={6} step={0.1} onChange={(v) => update({ r0: v })} />
        <Slider label="Infectious period (days)" value={infPeriod} min={1} max={21} step={1} onChange={(v) => update({ infPeriod: v })} />
        <Slider label="Initial immune (vaccinated)" value={vacc} min={0} max={0.9} step={0.05} onChange={(v) => update({ vacc: v })} />
        <p className="mt-3 text-xs text-slate-500">The SIR model splits a population into Susceptible, Infected, and Recovered and lets them flow between compartments. R₀ — the average number infected by one case — sets whether an outbreak grows. Vaccinating above the herd-immunity threshold 1−1/R₀ prevents an epidemic outright.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Peak infected" value={`${(peakI * 100).toFixed(1)}%`} /><Stat label="Total infected" value={`${(totalInf * 100).toFixed(1)}%`} /><Stat label="Herd immunity" value={`${(herd * 100).toFixed(0)}%`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
