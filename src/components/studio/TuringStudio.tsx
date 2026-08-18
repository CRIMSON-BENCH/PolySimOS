"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { Equation } from "./Equation";

// Machines: rule table state,read -> [write, move(+1/-1), nextState]. "H" halts.
type Rule = Record<string, [number, number, string]>;
const MACHINES: Record<string, { rules: Rule; start: string; desc: string }> = {
  "3-state busy beaver": { start: "A", desc: "Writes the maximum 1s then halts (Σ=6).", rules: {
    "A,0": [1, 1, "B"], "A,1": [1, -1, "C"], "B,0": [1, -1, "A"], "B,1": [1, 1, "B"], "C,0": [1, -1, "B"], "C,1": [1, 1, "H"] } },
  "Binary increment": { start: "R", desc: "Moves right to the end, then adds 1 in binary.", rules: {
    "R,0": [0, 1, "R"], "R,1": [1, 1, "R"], "R,_": [0, -1, "A"], "A,0": [1, -1, "D"], "A,1": [0, -1, "A"], "A,_": [1, -1, "D"], "D,0": [0, -1, "D"], "D,1": [1, -1, "D"], "D,_": [0, 1, "H"] } },
};

export function TuringStudio() {
  const [machine, setMachine] = useState("3-state busy beaver");
  const machineRef = useRef(machine); machineRef.current = machine;
  const tape = useRef<Map<number, number>>(new Map());
  const head = useRef(0); const st = useRef("A"); const steps = useRef(0);
  const [, force] = useState(0);
  const halted = useRef(false);

  const reset = () => { tape.current = new Map(); head.current = 0; st.current = MACHINES[machine].start; steps.current = 0; halted.current = false; force((n) => n + 1); };
  useEffect(reset, [machine]);

  const frame = (n: number) => {
    if (halted.current) return;
    const m = MACHINES[machineRef.current];
    for (let s = 0; s < n && !halted.current; s++) {
      const read = tape.current.get(head.current) ?? 0;
      const key = `${st.current},${read}`; const ruleKey = m.rules[key] ? key : `${st.current},_`;
      const rule = m.rules[ruleKey]; if (!rule) { halted.current = true; break; }
      const [w, mv, next] = rule; tape.current.set(head.current, w); head.current += mv; st.current = next; steps.current++;
      if (next === "H") halted.current = true;
    }
    force((c) => c + 1);
  };

  const t = useTransport(frame);

  const cells = []; for (let i = head.current - 14; i <= head.current + 14; i++) cells.push(i);

  const explain =
    machine === "3-state busy beaver"
      ? "This 3-state busy beaver writes the maximum possible six 1s onto a blank tape before halting — the champion for its size, and a vivid reminder that even tiny machines can be hard to predict."
      : "This binary-increment machine scans right to the least-significant end of the number, then adds one and carries as it goes — a full arithmetic operation built from just a handful of rules.";

  const m0 = MACHINES[machine];
  const rulesPy = Object.entries(m0.rules)
    .map(([k, [w, mv, n]]) => `    "${k}": (${w}, ${mv}, "${n}")`)
    .join(",\n");
  const code = `# Turing machine: ${machine}
rules = {
${rulesPy}
}
tape, head, state, steps = {}, 0, "${m0.start}", 0
while state != "H" and steps < 100000:
    read = tape.get(head, 0)
    key = f"{state},{read}"
    key = key if key in rules else f"{state},_"
    if key not in rules: break
    w, mv, state = rules[key]
    tape[head] = w; head += mv; steps += 1
print("steps:", steps, "ones:", sum(1 for v in tape.values() if v == 1))`;

  return (
    <StudioChrome title="Turing Machine" tagline="the model of all computation"
      controls={<div>
        <div className="mb-3 grid gap-2">{Object.keys(MACHINES).map((k) => <button key={k} onClick={() => setMachine(k)} className={`rounded-lg px-2 py-1.5 text-xs font-semibold ${machine === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{k}</button>)}</div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { reset(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mt-3 text-xs text-slate-500">{MACHINES[machine].desc} A finite state machine plus an infinite tape — the abstract computer that defines what is computable at all.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="State" value={st.current} /><Stat label="Steps" value={String(steps.current)} /><Stat label="Status" value={halted.current ? "HALTED" : "running"} /><Equation tex={`\\delta(q,\\,s) = (q',\\,s',\\,D), \\quad q = \\text{${st.current}}`} /><ExplainResult text={explain} /></div>}
    ><div className="flex flex-col items-center justify-center py-10">
        <div className="mb-2 text-cyan-400">▼</div>
        <div className="flex gap-0.5">{cells.map((i) => { const v = tape.current.get(i) ?? 0; const isHead = i === head.current; return <div key={i} className={`flex h-10 w-10 items-center justify-center rounded border font-mono text-lg ${isHead ? "border-cyan-400 bg-cyan-500/20 text-cyan-200" : "border-slate-700 bg-slate-900 text-slate-400"}`}>{v}</div>; })}</div>
        <div className="mt-6 font-mono text-sm text-slate-500">state = <span className="text-cyan-300">{st.current}</span> · step {steps.current}</div>
      </div></StudioChrome>
  );
}
