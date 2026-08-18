"use client";

import { useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";

const GATES: Record<string, (a: number, b: number) => number> = {
  AND: (a, b) => a & b, OR: (a, b) => a | b, NAND: (a, b) => 1 - (a & b), NOR: (a, b) => 1 - (a | b), XOR: (a, b) => a ^ b, XNOR: (a, b) => 1 - (a ^ b),
};

export function LogicGatesStudio() {
  const [gate, setGate] = useState("AND");
  const [a, setA] = useState(1), [b, setB] = useState(0);
  const fn = GATES[gate], out = fn(a, b);

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
      </div>}
      inspector={<div>
        <div className="mb-3 text-center"><div className="text-xs text-slate-500">{gate} output</div><div className={`text-4xl font-black ${out ? "text-cyan-400" : "text-slate-500"}`}>{out}</div></div>
        <div className="text-xs">
          <div className="mb-1 flex justify-between border-b border-slate-200 pb-1 font-semibold text-slate-500 dark:border-slate-800"><span>A B</span><span>out</span></div>
          {[[0, 0], [0, 1], [1, 0], [1, 1]].map(([x, y]) => <div key={`${x}${y}`} className={`flex justify-between py-0.5 ${x === a && y === b ? "font-bold text-cyan-500" : "text-slate-500"}`}><span>{x} {y}</span><span>{fn(x, y)}</span></div>)}
        </div>
      </div>}
    ><div className="flex h-[320px] items-center justify-center rounded-lg bg-slate-950">
      <div className="text-center">
        <div className="text-sm text-slate-400">{a} {gate} {b} =</div>
        <div className={`mt-2 text-7xl font-black ${out ? "text-cyan-400" : "text-slate-600"}`}>{out}</div>
      </div>
    </div></StudioChrome>
  );
}
