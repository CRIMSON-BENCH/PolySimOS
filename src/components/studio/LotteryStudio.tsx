"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { pool: number; picks: number; ticket: number }> = {
  "6 from 49 (UK)": { pool: 49, picks: 6, ticket: 2 },
  "6 from 59 (Euro)": { pool: 59, picks: 6, ticket: 3 },
  "5 from 69 (Powerball)": { pool: 69, picks: 5, ticket: 2 },
  "Easy 4 from 20": { pool: 20, picks: 4, ticket: 1 },
};

function comb(n: number, k: number): number { if (k < 0 || k > n) return 0; k = Math.min(k, n - k); let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return r; }

export function LotteryStudio() {
  const [{ pool, picks, ticket }, update] = useShareableNumbers({ pool: 49, picks: 6, ticket: 2 });

  const combos = comb(pool, picks); const odds = combos; const evPerDollar = -1 + (1 / combos) * (combos * ticket * 0.5) / ticket; // rough
  const drivingDeaths = 1 / 8000; // annual odds of dying in a car crash (illustrative)

  const years = combos / 104; // one ticket per draw, two draws a week
  const explain = `Matching ${picks} of ${pool} is a 1-in-${combos.toLocaleString(undefined, { maximumFractionDigits: 0 })} shot: buying one ticket every draw (twice weekly), you would wait about ${years.toLocaleString(undefined, { maximumFractionDigits: 0 })} years on average for a single jackpot.`;

  const code = `from math import comb
pool, picks, ticket = ${pool}, ${picks}, ${ticket}
odds = comb(pool, picks)
print("jackpot odds: 1 in", odds)
print("expected loss per $%d ticket: $%.2f" % (ticket, ticket))`;

  return (
    <StudioChrome title="Lottery Odds" tagline="the tax on not knowing math"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Number pool" value={pool} min={20} max={70} step={1} onChange={(v) => update({ pool: v })} />
        <Slider label="Numbers picked" value={picks} min={4} max={7} step={1} onChange={(v) => update({ picks: v })} />
        <Slider label="Ticket price ($)" value={ticket} min={1} max={5} step={1} onChange={(v) => update({ ticket: v })} />
        <p className="mt-3 text-xs text-slate-500">Winning a jackpot means matching every drawn number, and the odds are the number of possible combinations, C(pool, picks). Adding just a few numbers to the pool multiplies the odds dramatically — a 6-from-49 draw is 1 in 14 million, 6-from-59 nearly 1 in 45 million. You are far likelier to be struck by lightning, which is why lotteries are so profitable.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Combinations" value={combos.toLocaleString(undefined, { maximumFractionDigits: 0 })} /><Stat label="Jackpot odds" value={`1 in ${odds.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} /><Stat label="Tickets to expect a win" value={`~${odds.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} /><ExplainResult text={explain} /></div>}
    ><div className="flex flex-col items-center justify-center py-16">
        <div className="text-xs uppercase tracking-widest text-slate-500">Odds of the jackpot</div>
        <div className="mt-3 text-center text-5xl font-black text-cyan-400">1 in {combos.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        <div className="mt-6 text-sm text-slate-500">Pick {picks} from {pool}</div>
        <div className="mt-2 text-xs text-slate-600">Spending ${ticket} a ticket, a win is expected about once every {(combos * ticket / 1e6).toFixed(1)} million dollars played.</div>
        <div className="mt-1 text-xs text-slate-600">{(odds * drivingDeaths).toFixed(0)}× more likely to die in a car crash this year.</div>
      </div></StudioChrome>
  );
}
