"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { ratingA: number; ratingB: number; k: number }> = {
  "Even match": { ratingA: 1500, ratingB: 1500, k: 32 },
  "Heavy favorite": { ratingA: 2000, ratingB: 1200, k: 32 },
  "Grandmasters": { ratingA: 2700, ratingB: 2650, k: 16 },
  "Provisional (high K)": { ratingA: 1600, ratingB: 1400, k: 64 },
};

export function EloStudio() {
  const [{ ratingA, ratingB, k }, update] = useShareableNumbers({ ratingA: 1600, ratingB: 1500, k: 32 });

  const expA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expB = 1 - expA;
  const winA = ratingA + k * (1 - expA), lossA = ratingA + k * (0 - expA);

  const explain = `A is rated ${ratingA - ratingB > 0 ? "+" : ""}${(ratingA - ratingB).toFixed(0)} vs B, a ${(expA * 100).toFixed(0)}% win chance — every 400-point gap multiplies the odds tenfold. With K=${k}, a win nudges A by ${(winA - ratingA).toFixed(0)} but a loss costs ${(lossA - ratingA).toFixed(0)}, so beating a stronger foe pays far more than beating a weaker one.`;

  const code = `ratingA, ratingB, k = ${ratingA}, ${ratingB}, ${k}
expA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400))
new_if_win  = ratingA + k * (1 - expA)
new_if_loss = ratingA + k * (0 - expA)
print(f"A win prob: {expA*100:.1f}%")`;

  return (
    <StudioChrome title="Elo Rating System" tagline="who should win?"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Player A rating" value={ratingA} min={800} max={2800} step={10} onChange={(v) => update({ ratingA: v })} />
        <Slider label="Player B rating" value={ratingB} min={800} max={2800} step={10} onChange={(v) => update({ ratingB: v })} />
        <Slider label="K-factor" value={k} min={10} max={64} step={2} onChange={(v) => update({ k: v })} />
        <p className="mt-3 text-xs text-slate-500">The Elo system, born in chess and now everywhere from tennis to video games, turns a rating gap into a win probability. Every 400 points means a tenfold odds advantage. After each game, ratings shift by the K-factor times the surprise — beating a much stronger opponent gains far more than beating a weaker one, and an upset costs the favorite dearly.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="A win probability" value={`${(expA * 100).toFixed(1)}%`} /><Stat label="B win probability" value={`${(expB * 100).toFixed(1)}%`} /><Stat label="A rating if win" value={`+${(winA - ratingA).toFixed(0)}`} /><Stat label="A rating if loss" value={`${(lossA - ratingA).toFixed(0)}`} /><Equation tex={`E_A = \\frac{1}{1 + 10^{(${ratingB} - ${ratingA})/400}} = ${expA.toFixed(3)},\\quad R_A' = R_A + ${k}(S - E_A)`} /><ExplainResult text={explain} /></div>}
    ><div className="flex items-center justify-center gap-6 py-16">
        <div className="text-center"><div className="text-xs text-slate-500">Player A</div><div className="text-4xl font-black text-cyan-400">{ratingA}</div><div className="mt-2 text-2xl font-bold text-slate-200">{(expA * 100).toFixed(0)}%</div></div>
        <div className="text-3xl text-slate-600">vs</div>
        <div className="text-center"><div className="text-xs text-slate-500">Player B</div><div className="text-4xl font-black text-pink-400">{ratingB}</div><div className="mt-2 text-2xl font-bold text-slate-200">{(expB * 100).toFixed(0)}%</div></div>
      </div></StudioChrome>
  );
}
