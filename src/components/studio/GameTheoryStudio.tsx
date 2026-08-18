"use client";

import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { useState } from "react";

// 2x2 game: find pure Nash equilibria.
const GAMES: Record<string, number[][][]> = {
  "Prisoner's Dilemma": [[[3, 3], [0, 5]], [[5, 0], [1, 1]]],
  "Stag Hunt": [[[4, 4], [0, 3]], [[3, 0], [2, 2]]],
  "Matching Pennies": [[[1, -1], [-1, 1]], [[-1, 1], [1, -1]]],
  "Chicken": [[[0, 0], [-1, 1]], [[1, -1], [-5, -5]]],
};

export function GameTheoryStudio() {
  const [game, setGame] = useState("Prisoner's Dilemma");
  const P = GAMES[game]; // P[rowChoice][colChoice] = [rowPayoff, colPayoff]
  // pure Nash: row best response given col, and col best response given row
  const nash: [number, number][] = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
    const rowBest = P[r][c][0] >= P[1 - r][c][0]; const colBest = P[r][c][1] >= P[r][1 - c][1];
    if (rowBest && colBest) nash.push([r, c]);
  }
  const labels = { "Prisoner's Dilemma": ["Cooperate", "Defect"], "Stag Hunt": ["Stag", "Hare"], "Matching Pennies": ["Heads", "Tails"], Chicken: ["Swerve", "Straight"] }[game]!;

  const explain =
    nash.length === 0
      ? "No cell is stable — from every outcome one player wants to switch, so the only equilibrium is a randomized mix (here, 50/50)."
      : game === "Prisoner's Dilemma"
      ? "The lone equilibrium has both players defect, even though mutual cooperation pays more — individually rational, collectively worse."
      : nash.length >= 2
      ? "Two pure equilibria coexist, so the outcome hinges on coordination and trust — players can get locked into the safer but worse one."
      : "A single dominant equilibrium: neither player can gain by deviating, so rational play converges straight to it.";

  const code = `import itertools
# payoff[r][c] = (row_payoff, col_payoff)
payoff = ${JSON.stringify(P)}
nash = []
for r, c in itertools.product((0, 1), repeat=2):
    row_best = payoff[r][c][0] >= payoff[1 - r][c][0]
    col_best = payoff[r][c][1] >= payoff[r][1 - c][1]
    if row_best and col_best:
        nash.append((r, c))
print("pure Nash equilibria:", nash)`;

  return (
    <StudioChrome title="Game Theory (Nash)" tagline="2×2 strategic games"
      controls={<div>
        <div className="mb-3 grid gap-2">{Object.keys(GAMES).map((k) => <button key={k} onClick={() => setGame(k)} className={`rounded-lg px-2 py-1.5 text-xs font-semibold ${game === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{k}</button>)}</div>
        <p className="mt-3 text-xs text-slate-500">A Nash equilibrium is a pair of strategies where neither player can do better by unilaterally changing — the cornerstone of game theory. In the Prisoner&apos;s Dilemma both defect even though cooperating pays more; Matching Pennies has no pure equilibrium at all. Highlighted cells are the pure-strategy Nash equilibria.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Game" value={game} /><Stat label="Pure Nash equilibria" value={String(nash.length)} /><Stat label="Type" value={nash.length === 0 ? "mixed only" : nash.length === 1 ? "dominant" : "multiple"} /><Equation tex={`\\begin{pmatrix} (${P[0][0][0]},${P[0][0][1]}) & (${P[0][1][0]},${P[0][1][1]}) \\\\ (${P[1][0][0]},${P[1][0][1]}) & (${P[1][1][0]},${P[1][1][1]}) \\end{pmatrix},\\quad u_i(s_i^*,s_{-i}) \\ge u_i(s_i,s_{-i})`} /><ExplainResult text={explain} /></div>}
    ><div className="flex flex-col items-center py-6">
        <div className="mb-2 text-xs uppercase tracking-widest text-slate-500">Row player vs Column player</div>
        <table className="border-collapse">
          <thead><tr><th></th><th className="px-3 py-1 text-sm text-slate-400">{labels[0]}</th><th className="px-3 py-1 text-sm text-slate-400">{labels[1]}</th></tr></thead>
          <tbody>
            {[0, 1].map((r) => (
              <tr key={r}>
                <th className="px-2 text-sm text-slate-400">{labels[r]}</th>
                {[0, 1].map((c) => { const isN = nash.some(([nr, nc]) => nr === r && nc === c); return (
                  <td key={c} className={`h-20 w-28 border text-center ${isN ? "border-pink-400 bg-pink-500/20" : "border-slate-700 bg-slate-900/50"}`}>
                    <div className="text-lg font-bold text-cyan-300">{P[r][c][0]}</div>
                    <div className="text-lg font-bold text-lime-300">{P[r][c][1]}</div>
                    {isN && <div className="text-[10px] uppercase text-pink-300">Nash</div>}
                  </td>
                ); })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 text-xs text-slate-500">cyan = row payoff · green = column payoff</div>
      </div></StudioChrome>
  );
}
