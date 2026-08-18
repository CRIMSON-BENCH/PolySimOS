"use client";

import { useEffect, useMemo, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { pAA: number; pBB: number; pCC: number }> = {
  "Sticky A": { pAA: 0.9, pBB: 0.3, pCC: 0.3 },
  "Balanced": { pAA: 0.5, pBB: 0.5, pCC: 0.5 },
  "Sticky C": { pAA: 0.3, pBB: 0.3, pCC: 0.9 },
  "Fast mixing": { pAA: 0.1, pBB: 0.1, pCC: 0.1 },
};

export function MarkovStudio() {
  const [{ pAA, pBB, pCC }, update] = useShareableNumbers({ pAA: 0.7, pBB: 0.6, pCC: 0.5 });
  const [step, setStep] = useState(0);

  const P = useMemo(() => {
    const r = (stay: number) => { const rest = (1 - stay) / 2; return [stay, rest, rest]; };
    return [r(pAA), [(1 - pBB) / 2, pBB, (1 - pBB) / 2], [(1 - pCC) / 2, (1 - pCC) / 2, pCC]];
  }, [pAA, pBB, pCC]);

  const dist = useMemo(() => {
    let v = [1, 0, 0];
    for (let s = 0; s < step; s++) { const nv = [0, 0, 0]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) nv[j] += v[i] * P[i][j]; v = nv; }
    return v;
  }, [P, step]);

  useEffect(() => { const id = setInterval(() => setStep((s) => (s < 40 ? s + 1 : s)), 200); return () => clearInterval(id); }, [P]);
  useEffect(() => { setStep(0); }, [pAA, pBB, pCC]);

  const names = ["A", "B", "C"], colors = ["#22d3ee", "#a3e635", "#f472b6"];

  const stays = [pAA, pBB, pCC];
  const topIdx = stays.indexOf(Math.max(...stays));
  const explain =
    Math.max(...stays) - Math.min(...stays) < 0.06
      ? "The self-loop probabilities are nearly equal, so the chain mixes to a roughly uniform stationary distribution — no state hogs the long-run mass."
      : `State ${names[topIdx]} has the stickiest self-loop (${stays[topIdx].toFixed(2)}), so it keeps the largest share of the stationary distribution no matter where you start.`;

  const code = `import numpy as np
pAA, pBB, pCC = ${pAA}, ${pBB}, ${pCC}
P = np.array([
    [pAA, (1-pAA)/2, (1-pAA)/2],
    [(1-pBB)/2, pBB, (1-pBB)/2],
    [(1-pCC)/2, (1-pCC)/2, pCC],
])
v = np.array([1.0, 0, 0])
for _ in range(200):
    v = v @ P
print("stationary", v.round(3))`;

  return (
    <StudioChrome title="Markov Chain" tagline="transitions → stationary distribution"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">A system hops between states by fixed probabilities. From any start it converges to the same stationary distribution — the math behind PageRank and queueing.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Stay in A" value={pAA} min={0.1} max={0.9} step={0.05} onChange={(v) => update({ pAA: v })} />
        <Slider label="Stay in B" value={pBB} min={0.1} max={0.9} step={0.05} onChange={(v) => update({ pBB: v })} />
        <Slider label="Stay in C" value={pCC} min={0.1} max={0.9} step={0.05} onChange={(v) => update({ pCC: v })} />
        <button onClick={() => setStep(0)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Restart from A</button>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Step" value={String(step)} /><Stat label="P(A)" value={dist[0].toFixed(3)} /><Stat label="P(B)" value={dist[1].toFixed(3)} /><Stat label="P(C)" value={dist[2].toFixed(3)} /><ExplainResult text={explain} /></div>}
    >
      <div className="flex h-full min-h-[360px] items-end justify-center gap-16 p-10">
        {dist.map((p, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="flex w-28 items-end justify-center rounded-t-lg" style={{ height: `${p * 300 + 4}px`, background: colors[i] }} />
            <span className="mt-2 text-lg font-bold text-slate-200">{names[i]}</span>
            <span className="font-mono text-xs text-slate-500">{(p * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </StudioChrome>
  );
}
