"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { useState } from "react";

function comb(n: number, k: number): number { if (k < 0 || k > n) return 0; k = Math.min(k, n - k); let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return r; }

export function LotteryStudio() {
  const [pool, setPool] = useState(49);
  const [picks, setPicks] = useState(6);
  const [ticket, setTicket] = useState(2); // $

  const combos = comb(pool, picks); const odds = combos; const evPerDollar = -1 + (1 / combos) * (combos * ticket * 0.5) / ticket; // rough
  const drivingDeaths = 1 / 8000; // annual odds of dying in a car crash (illustrative)

  return (
    <StudioChrome title="Lottery Odds" tagline="the tax on not knowing math"
      controls={<div>
        <Slider label="Number pool" value={pool} min={20} max={70} step={1} onChange={setPool} />
        <Slider label="Numbers picked" value={picks} min={4} max={7} step={1} onChange={setPicks} />
        <Slider label="Ticket price ($)" value={ticket} min={1} max={5} step={1} onChange={setTicket} />
        <p className="mt-3 text-xs text-slate-500">Winning a jackpot means matching every drawn number, and the odds are the number of possible combinations, C(pool, picks). Adding just a few numbers to the pool multiplies the odds dramatically — a 6-from-49 draw is 1 in 14 million, 6-from-59 nearly 1 in 45 million. You are far likelier to be struck by lightning, which is why lotteries are so profitable.</p>
      </div>}
      inspector={<div><Stat label="Combinations" value={combos.toLocaleString(undefined, { maximumFractionDigits: 0 })} /><Stat label="Jackpot odds" value={`1 in ${odds.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} /><Stat label="Tickets to expect a win" value={`~${odds.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} /></div>}
    ><div className="flex flex-col items-center justify-center py-16">
        <div className="text-xs uppercase tracking-widest text-slate-500">Odds of the jackpot</div>
        <div className="mt-3 text-center text-5xl font-black text-cyan-400">1 in {combos.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        <div className="mt-6 text-sm text-slate-500">Pick {picks} from {pool}</div>
        <div className="mt-2 text-xs text-slate-600">Spending ${ticket} a ticket, a win is expected about once every {(combos * ticket / 1e6).toFixed(1)} million dollars played.</div>
        <div className="mt-1 text-xs text-slate-600">{(odds * drivingDeaths).toFixed(0)}× more likely to die in a car crash this year.</div>
      </div></StudioChrome>
  );
}
