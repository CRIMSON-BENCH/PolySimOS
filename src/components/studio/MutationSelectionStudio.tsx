"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function MutationSelectionStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [s, setS] = useState(0.1), [mu, setMu] = useState(0.001), [p0, setP0] = useState(0.5);
  // allele A frequency p; selection favors A by s; mutation A->a at rate mu
  const traj: number[] = []; let p = p0;
  for (let g = 0; g < 200; g++) { traj.push(p); const wbar = 1 - s * (1 - p) * (1 - p); const pSel = (p * (p + (1 - p) * (1 - s))) / (wbar || 1); p = pSel * (1 - mu); p = Math.max(0, Math.min(1, p)); }
  const eq = traj[traj.length - 1];

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 30, pw = W - 55, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); traj.forEach((v, i) => { const x = ox + i / traj.length * pw, y = oy - v * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("allele frequency over generations", ox + 6, oy - ph + 12); ctx.fillText("generations →", ox + pw - 90, oy + 18);
  }, [s, mu, p0]);

  return (
    <StudioChrome title="Mutation–Selection Balance" tagline="evolution of an allele"
      controls={<div>
        <Slider label="Selection coefficient s" value={s} min={0} max={0.5} step={0.01} onChange={setS} />
        <Slider label="Mutation rate µ" value={mu} min={0} max={0.02} step={0.001} onChange={setMu} />
        <Slider label="Starting frequency p₀" value={p0} min={0.01} max={0.99} step={0.01} onChange={setP0} />
        <p className="mt-3 text-xs text-slate-500">Selection pushes a favorable allele toward fixation, while mutation keeps feeding the alternative back in. The two forces settle at a mutation–selection balance — which is why harmful alleles never fully disappear from a population. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Equilibrium frequency" value={eq.toFixed(3)} />
        <Stat label="Direction" value={eq > p0 + 0.01 ? "rising (selected)" : eq < p0 - 0.01 ? "falling" : "at balance"} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
