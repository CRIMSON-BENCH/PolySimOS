"use client";

import { useMemo } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { keq: number; addReactant: number; temp: number }> = {
  "Products favored": { keq: 5, addReactant: 1, temp: 1 },
  "Reactants favored": { keq: 0.3, addReactant: 1, temp: 1 },
  "Add reactant": { keq: 2, addReactant: 3, temp: 1 },
  "Heat the flask": { keq: 2, addReactant: 1, temp: 2.4 },
};

export function EquilibriumStudio() {
  const [{ keq, addReactant, temp }, update] = useShareableNumbers({ keq: 2, addReactant: 1, temp: 1 });

  const { a, b } = useMemo(() => {
    const K = keq * temp; const total = 2 * addReactant;
    const bFrac = K / (1 + K); const bAmt = total * bFrac, aAmt = total - bAmt;
    return { a: aAmt, b: bAmt };
  }, [keq, addReactant, temp]);
  const total = a + b;

  const Keff = keq * temp;
  const explain =
    Keff > 3
      ? "Effective K is well above 1, so equilibrium sits far toward product B — the forward reaction dominates."
      : Keff < 0.5
      ? "Effective K is well below 1, so equilibrium favors reactant A and only a little B forms."
      : "Effective K is near 1, so A and B coexist in comparable amounts and a small stress can tip the balance either way.";

  const code = `keq, add, temp = ${keq}, ${addReactant}, ${temp}
K = keq * temp
total = 2 * add
b = total * K / (1 + K)
a = total - b
print("[A]", round(a, 3), "[B]", round(b, 3), "favored", "B" if b > a else "A")`;

  return (
    <StudioChrome title="Chemical Equilibrium (Le Chatelier)" tagline="A ⇌ B shifting with stress"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">A reversible reaction A ⇌ B settles where forward and reverse rates balance. Add reactant or raise temperature and watch the equilibrium shift to relieve the stress.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Equilibrium constant K" value={keq} min={0.1} max={6} step={0.1} onChange={(v) => update({ keq: v })} />
        <Slider label="Amount added" value={addReactant} min={0.5} max={3} step={0.1} onChange={(v) => update({ addReactant: v })} />
        <Slider label="Temperature factor" value={temp} min={0.3} max={2.5} step={0.1} onChange={(v) => update({ temp: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="K (effective)" value={(keq * temp).toFixed(2)} /><Stat label="[A]" value={a.toFixed(2)} /><Stat label="[B]" value={b.toFixed(2)} /><Stat label="Favored" value={b > a ? "products" : "reactants"} /><Equation tex={`K_{eq} = \\frac{[B]}{[A]} = \\frac{${b.toFixed(2)}}{${a.toFixed(2)}} \\approx ${(a > 0 ? b / a : 0).toFixed(2)}`} /><ExplainResult text={explain} /></div>}
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
