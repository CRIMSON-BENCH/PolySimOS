"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { s: number; mu: number; p0: number }> = {
  "Strong selection": { s: 0.4, mu: 0.001, p0: 0.1 },
  "Weak selection": { s: 0.02, mu: 0.005, p0: 0.5 },
  "High mutation": { s: 0.1, mu: 0.02, p0: 0.9 },
  "Neutral (s=0)": { s: 0, mu: 0.005, p0: 0.5 },
};

export function MutationSelectionStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ s, mu, p0 }, update] = useShareableNumbers({ s: 0.1, mu: 0.001, p0: 0.5 });
  // allele A frequency p; selection favors A by s; mutation A->a at rate mu
  const traj: number[] = []; let p = p0;
  for (let g = 0; g < 200; g++) { traj.push(p); const wbar = 1 - s * (1 - p) * (1 - p); const pSel = (p * (p + (1 - p) * (1 - s))) / (wbar || 1); p = pSel * (1 - mu); p = Math.max(0, Math.min(1, p)); }
  const eq = traj[traj.length - 1];

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 30, pw = W - 55, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); traj.forEach((v, i) => { const x = ox + i / traj.length * pw, y = oy - v * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("allele frequency over generations", ox + 6, oy - ph + 12); ctx.fillText("generations →", ox + pw - 90, oy + 18);
  }, [s, mu, p0]);

  const explain =
    s === 0
      ? "With no selection, only mutation acts — the favored allele slowly bleeds toward the alternative every generation."
      : eq > 0.99
      ? "Selection overwhelms mutation, so the favorable allele is nearly fixed — yet µ keeps a tiny sliver of the alternative alive forever."
      : mu >= s
      ? "Mutation is as strong as selection here, dragging the allele well below fixation and holding it at a low balance point."
      : "Selection pushes the allele up while mutation feeds the alternative back in; they settle at the equilibrium frequency shown.";

  const code = `import numpy as np
s, mu, p0 = ${s}, ${mu}, ${p0}
p = p0
for _ in range(200):
    wbar = 1 - s*(1 - p)**2
    p = (p*(p + (1 - p)*(1 - s))/wbar)*(1 - mu)
    p = min(1.0, max(0.0, p))
print("equilibrium frequency", p)`;

  return (
    <StudioChrome title="Mutation–Selection Balance" tagline="evolution of an allele"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Selection coefficient s" value={s} min={0} max={0.5} step={0.01} onChange={(v) => update({ s: v })} />
        <Slider label="Mutation rate µ" value={mu} min={0} max={0.02} step={0.001} onChange={(v) => update({ mu: v })} />
        <Slider label="Starting frequency p₀" value={p0} min={0.01} max={0.99} step={0.01} onChange={(v) => update({ p0: v })} />
        <p className="mt-3 text-xs text-slate-500">Selection pushes a favorable allele toward fixation, while mutation keeps feeding the alternative back in. The two forces settle at a mutation–selection balance — which is why harmful alleles never fully disappear from a population. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Equilibrium frequency" value={eq.toFixed(3)} />
        <Stat label="Direction" value={eq > p0 + 0.01 ? "rising (selected)" : eq < p0 - 0.01 ? "falling" : "at balance"} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
