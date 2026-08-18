"use client";

import { useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";

const GATES: Record<string, (a: number, b: number) => number> = {
  AND: (a, b) => a & b, OR: (a, b) => a | b, NAND: (a, b) => 1 - (a & b), NOR: (a, b) => 1 - (a | b), XOR: (a, b) => a ^ b, XNOR: (a, b) => 1 - (a ^ b),
};

const GATE_INSIGHT: Record<string, string> = {
  AND: "outputs 1 only when both inputs are 1 — the logical 'both'.",
  OR: "outputs 1 when at least one input is 1 — the logical 'either'.",
  NAND: "is the inverse of AND and is universal: any digital circuit whatsoever can be built from NAND gates alone.",
  NOR: "is the inverse of OR and is universal: any digital circuit whatsoever can be built from NOR gates alone.",
  XOR: "outputs 1 only when the inputs differ — a one-bit inequality detector and the core of binary addition.",
  XNOR: "outputs 1 only when the inputs match — a one-bit equality detector.",
};

const GATE_EXPR: Record<string, string> = {
  AND: "a & b", OR: "a | b", NAND: "1 - (a & b)", NOR: "1 - (a | b)", XOR: "a ^ b", XNOR: "1 - (a ^ b)",
};

const GATE_TEX: Record<string, string> = {
  AND: "A \\cdot B", OR: "A + B", NAND: "\\overline{A \\cdot B}", NOR: "\\overline{A + B}", XOR: "A \\oplus B", XNOR: "\\overline{A \\oplus B}",
};

export function LogicGatesStudio() {
  const [gate, setGate] = useState("AND");
  const [a, setA] = useState(1), [b, setB] = useState(0);
  const fn = GATES[gate], out = fn(a, b);

  const explain = `${gate} ${GATE_INSIGHT[gate]} With A=${a} and B=${b} the output is ${out}.`;

  const expr = GATE_EXPR[gate];
  const code = `a, b = ${a}, ${b}
# ${gate} gate
print(${expr})
# full truth table
for x in (0, 1):
    for y in (0, 1):
        print(x, y, (${expr.replace(/a/g, "x").replace(/b/g, "y")}))`;

  return (
    <StudioChrome title="Logic Gates & Truth Tables" tagline="the atoms of digital circuits"
      controls={<div>
        <label className="mb-2 block text-xs text-slate-400">Gate</label>
        <select value={gate} onChange={(e) => setGate(e.target.value)} className="mb-3 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">{Object.keys(GATES).map((g) => <option key={g} value={g}>{g}</option>)}</select>
        <div className="flex gap-2">
          <button onClick={() => setA(1 - a)} className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${a ? "bg-cyan-600 text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>A = {a}</button>
          <button onClick={() => setB(1 - b)} className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${b ? "bg-cyan-600 text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>B = {b}</button>
        </div>
        <p className="mt-3 text-xs text-slate-500">Every digital chip is built from a handful of logic gates. Toggle the inputs and watch the output flip. NAND and NOR are universal: any circuit can be built from either one alone. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <div className="mb-3 text-center"><div className="text-xs text-slate-500">{gate} output</div><div className={`text-4xl font-black ${out ? "text-cyan-400" : "text-slate-500"}`}>{out}</div></div>
        <div className="text-xs">
          <div className="mb-1 flex justify-between border-b border-slate-200 pb-1 font-semibold text-slate-500 dark:border-slate-800"><span>A B</span><span>out</span></div>
          {[[0, 0], [0, 1], [1, 0], [1, 1]].map(([x, y]) => <div key={`${x}${y}`} className={`flex justify-between py-0.5 ${x === a && y === b ? "font-bold text-cyan-500" : "text-slate-500"}`}><span>{x} {y}</span><span>{fn(x, y)}</span></div>)}
        </div>
        <Equation tex={`Y = ${GATE_TEX[gate]} = ${out}`} />
        <ExplainResult text={explain} />
      </div>}
    ><div className="flex h-[320px] items-center justify-center rounded-lg bg-slate-950">
      <div className="text-center">
        <div className="text-sm text-slate-400">{a} {gate} {b} =</div>
        <div className={`mt-2 text-7xl font-black ${out ? "text-cyan-400" : "text-slate-600"}`}>{out}</div>
      </div>
    </div></StudioChrome>
  );
}
