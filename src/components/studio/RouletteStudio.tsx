"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { useState } from "react";

const BETS: Record<string, { win: number; payout: number }> = {
  "Straight (single)": { win: 1, payout: 35 }, "Split (2)": { win: 2, payout: 17 }, "Corner (4)": { win: 4, payout: 8 },
  "Dozen (12)": { win: 12, payout: 2 }, "Red/Black (18)": { win: 18, payout: 1 }, "Even/Odd (18)": { win: 18, payout: 1 },
};

export function RouletteStudio() {
  const [bet, setBet] = useState("Red/Black (18)");
  const [american, setAmerican] = useState(true);
  const [wager, setWager] = useState(10);

  const slots = american ? 38 : 37; const b = BETS[bet]; const pWin = b.win / slots;
  const ev = pWin * b.payout * wager - (1 - pWin) * wager; const houseEdge = -ev / wager * 100;

  return (
    <StudioChrome title="Roulette House Edge" tagline="the math always wins"
      controls={<div>
        <div className="mb-3 grid gap-1">{Object.keys(BETS).map((k) => <button key={k} onClick={() => setBet(k)} className={`rounded-lg px-2 py-1 text-left text-xs font-semibold ${bet === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{k}</button>)}</div>
        <Slider label="Wager ($)" value={wager} min={1} max={100} step={1} onChange={setWager} />
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" checked={american} onChange={(e) => setAmerican(e.target.checked)} /> American wheel (00)</label>
        <p className="mt-3 text-xs text-slate-500">Roulette payouts are set as if the wheel had no zeros — but it does. That extra 0 (and 00 on American wheels) is where the house edge lives: every bet, from a single number to red/black, carries the same expected loss of 5.26% American or 2.70% European. No betting system changes it, because each spin is independent.</p>
      </div>}
      inspector={<div><Stat label="Win probability" value={`${(pWin * 100).toFixed(1)}%`} /><Stat label="Payout" value={`${b.payout} to 1`} /><Stat label="Expected value" value={`$${ev.toFixed(2)}`} /><Stat label="House edge" value={`${houseEdge.toFixed(2)}%`} /></div>}
    ><div className="flex flex-col items-center justify-center py-16">
        <div className="text-xs uppercase tracking-widest text-slate-500">Expected value per ${wager} bet</div>
        <div className="mt-3 text-6xl font-black text-red-400">−${Math.abs(ev).toFixed(2)}</div>
        <div className="mt-4 text-sm text-slate-500">house edge {houseEdge.toFixed(2)}% · {american ? "American (00)" : "European"} wheel</div>
        <div className="mt-2 text-xs text-slate-600">every bet type has the same edge — the wheel is undefeated</div>
      </div></StudioChrome>
  );
}
