"use client";

import { useMemo, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function EquilibriumStudio() {
  const [keq, setKeq] = useState(2);
  const [addReactant, setAddReactant] = useState(1);
  const [temp, setTemp] = useState(1);

  const { a, b } = useMemo(() => {
    const K = keq * temp; const total = 2 * addReactant;
    const bFrac = K / (1 + K); const bAmt = total * bFrac, aAmt = total - bAmt;
    return { a: aAmt, b: bAmt };
  }, [keq, addReactant, temp]);
  const total = a + b;

  return (
    <StudioChrome title="Chemical Equilibrium (Le Chatelier)" tagline="A ⇌ B shifting with stress"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">A reversible reaction A ⇌ B settles where forward and reverse rates balance. Add reactant or raise temperature and watch the equilibrium shift to relieve the stress.</p>
        <Slider label="Equilibrium constant K" value={keq} min={0.1} max={6} step={0.1} onChange={setKeq} />
        <Slider label="Amount added" value={addReactant} min={0.5} max={3} step={0.1} onChange={setAddReactant} />
        <Slider label="Temperature factor" value={temp} min={0.3} max={2.5} step={0.1} onChange={setTemp} />
      </div>}
      inspector={<div><Stat label="K (effective)" value={(keq * temp).toFixed(2)} /><Stat label="[A]" value={a.toFixed(2)} /><Stat label="[B]" value={b.toFixed(2)} /><Stat label="Favored" value={b > a ? "products" : "reactants"} /></div>}
    >
      <div className="flex h-full min-h-[360px] items-end justify-center gap-16 p-8">
        <div className="flex flex-col items-center">
          <div className="flex w-24 items-end justify-center rounded-t-lg bg-cyan-500" style={{ height: `${(a / total) * 300 + 4}px` }} />
          <span className="mt-2 text-sm font-semibold text-slate-300">A (reactant)</span>
          <span className="font-mono text-xs text-slate-500">{a.toFixed(2)} M</span>
        </div>
        <div className="pb-16 text-3xl text-slate-500">⇌</div>
        <div className="flex flex-col items-center">
          <div className="flex w-24 items-end justify-center rounded-t-lg bg-lime-500" style={{ height: `${(b / total) * 300 + 4}px` }} />
          <span className="mt-2 text-sm font-semibold text-slate-300">B (product)</span>
          <span className="font-mono text-xs text-slate-500">{b.toFixed(2)} M</span>
        </div>
      </div>
    </StudioChrome>
  );
}
