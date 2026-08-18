"use client";

import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { useState } from "react";

const HANDS = [
  { name: "Royal flush", count: 4 }, { name: "Straight flush", count: 36 }, { name: "Four of a kind", count: 624 },
  { name: "Full house", count: 3744 }, { name: "Flush", count: 5108 }, { name: "Straight", count: 10200 },
  { name: "Three of a kind", count: 54912 }, { name: "Two pair", count: 123552 }, { name: "One pair", count: 1098240 },
  { name: "High card", count: 1302540 },
];
const TOTAL = 2598960;

export function PokerOddsStudio() {
  const [hi, setHi] = useState(3);
  const pct = HANDS[hi].count / TOTAL * 100;
  const explain =
    pct < 0.01
      ? `A ${HANDS[hi].name.toLowerCase()} is genuinely rare — it turns up in only about 1 of every ${Math.round(TOTAL / HANDS[hi].count).toLocaleString()} five-card deals.`
      : pct > 20
      ? `A ${HANDS[hi].name.toLowerCase()} is one of the commonest outcomes — a large share of all hands land here, which is why it ranks near the bottom.`
      : `A ${HANDS[hi].name.toLowerCase()} sits mid-table: it fills about ${pct.toFixed(2)}% of the 2,598,960 possible hands, or roughly 1 in ${Math.round(TOTAL / HANDS[hi].count).toLocaleString()}.`;
  const code = `from math import comb
total = comb(52, 5)  # 2,598,960
counts = {
    "Royal flush": 4, "Straight flush": 36, "Four of a kind": 624,
    "Full house": 3744, "Flush": 5108, "Straight": 10200,
    "Three of a kind": 54912, "Two pair": 123552,
    "One pair": 1098240, "High card": 1302540,
}
name = ${JSON.stringify(HANDS[hi].name)}
p = counts[name] / total
print(name, counts[name], f"{p:.4%}", f"1 in {round(1/p)}")`;
  return (
    <StudioChrome title="Poker Hand Odds" tagline="the mathematics of a five-card hand"
      controls={<div>
        <div className="mb-2 text-xs font-semibold text-slate-500">Highlight a hand</div>
        <div className="grid gap-1">{HANDS.map((h, i) => <button key={h.name} onClick={() => setHi(i)} className={`rounded-lg px-2 py-1 text-left text-xs font-semibold ${hi === i ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{h.name}</button>)}</div>
        <p className="mt-3 text-xs text-slate-500">There are exactly 2,598,960 distinct five-card poker hands. Ranking them by rarity gives the hand hierarchy: a royal flush occurs once in about 650,000 deals, while nearly half of all hands are just a pair or high card. The odds are pure combinatorics — counting how many of the C(52,5) hands match each pattern.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label={HANDS[hi].name} value={`${HANDS[hi].count.toLocaleString()} hands`} /><Stat label="Probability" value={`${pct.toFixed(4)}%`} /><Stat label="Odds" value={`1 in ${Math.round(TOTAL / HANDS[hi].count).toLocaleString()}`} /><Equation tex={`P = \\dfrac{${HANDS[hi].count.toLocaleString()}}{\\binom{52}{5}} = \\dfrac{${HANDS[hi].count.toLocaleString()}}{2{,}598{,}960} \\approx ${pct.toFixed(4)}\\%`} /><ExplainResult text={explain} /></div>}
    ><div className="p-4">
        <div className="mb-2 text-center text-xs uppercase tracking-widest text-slate-500">Poker hands by probability (log scale)</div>
        {HANDS.map((h, i) => (
          <div key={h.name} className="mb-1.5 flex items-center gap-2">
            <div className="w-28 shrink-0 text-right text-xs text-slate-400">{h.name}</div>
            <div className="h-4 flex-1 rounded bg-slate-800"><div className="h-4 rounded" style={{ width: `${(Math.log10(h.count) / Math.log10(TOTAL)) * 100}%`, backgroundColor: i === hi ? "#f472b6" : "#22d3ee" }} /></div>
            <div className="w-24 shrink-0 text-xs text-slate-500">1 in {Math.round(TOTAL / h.count).toLocaleString()}</div>
          </div>
        ))}
      </div></StudioChrome>
  );
}
