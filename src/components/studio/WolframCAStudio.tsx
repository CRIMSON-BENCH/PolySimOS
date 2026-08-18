"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 401, ROWS = 200, CELL = 2;

const PRESETS: Record<string, { rule: number }> = {
  "Rule 30 (chaos)": { rule: 30 },
  "Rule 90 (Sierpinski)": { rule: 90 },
  "Rule 110 (Turing-complete)": { rule: 110 },
  "Rule 184 (traffic)": { rule: 184 },
};

export function WolframCAStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ rule }, update] = useShareableNumbers({ rule: 30 });
  const [random, setRandom] = useState(false);
  const [seed, setSeed] = useState(1);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W * CELL, ROWS * CELL); ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, W * CELL, ROWS * CELL);
    const R = Math.round(rule); let s = seed * 40503 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    let row = new Uint8Array(W);
    if (random) for (let i = 0; i < W; i++) row[i] = rnd() < 0.5 ? 1 : 0; else row[(W / 2) | 0] = 1;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < W; x++) if (row[x]) { ctx.fillStyle = "#a3e635"; ctx.fillRect(x * CELL, y * CELL, CELL, CELL); }
      const next = new Uint8Array(W);
      for (let x = 0; x < W; x++) { const l = row[(x - 1 + W) % W], c = row[x], r = row[(x + 1) % W]; const idx = (l << 2) | (c << 1) | r; next[x] = (R >> idx) & 1; }
      row = next;
    }
  }, [rule, random, seed]);

  const rNum = Math.round(rule);
  const explain =
    rNum === 30
      ? "Rule 30 is chaotic: from a single seed it never settles into a pattern, which is why its center column is used as a random-number generator."
      : rNum === 90
      ? "Rule 90 is exactly the XOR of its two neighbors, so a single seed unfolds into a Sierpinski triangle — self-similar fractal structure from a trivial rule."
      : rNum === 110
      ? "Rule 110 sits on the edge of chaos and order: its gliders can carry and combine information, making it proven Turing-complete."
      : rNum === 184
      ? "Rule 184 is the classic traffic model — 1s move right into empty cells, so you can watch jams form and dissolve."
      : [30, 90, 110, 45, 105, 150].includes(rNum)
      ? "This rule is in Wolfram Class 3/4: it produces complex, non-repeating structure rather than settling down."
      : "This rule is in Wolfram Class 1/2: it quickly collapses to a uniform or simply periodic pattern.";

  const code = `import numpy as np
rule = ${rNum}
row = np.zeros(401, dtype=int); row[200] = 1
for _ in range(200):
    print(''.join('#' if c else ' ' for c in row))
    l, r = np.roll(row, 1), np.roll(row, -1)
    idx = (l << 2) | (row << 1) | r
    row = (rule >> idx) & 1`;

  return (
    <StudioChrome title="Elementary Cellular Automata" tagline="Wolfram's 256 rules"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Rule number" value={rule} min={0} max={255} step={1} onChange={(v) => update({ rule: v })} />
        <div className="mt-3 flex flex-wrap gap-2">{[30, 90, 110, 54, 150, 184].map((r) => <button key={r} onClick={() => update({ rule: r })} className={`rounded-lg px-2 py-1 text-xs font-semibold ${rNum === r ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>Rule {r}</button>)}</div>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" checked={random} onChange={(e) => setRandom(e.target.checked)} /> Random initial row</label>
        {random && <button onClick={() => setSeed((n) => n + 1)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reseed</button>}
        <p className="mt-3 text-xs text-slate-500">Each cell&apos;s next state depends only on itself and its two neighbors, giving 256 possible rules. Rule 30 is chaotic (used as a random generator); Rule 110 is proven Turing-complete; Rule 90 draws a Sierpinski triangle.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Rule" value={String(rNum)} /><Stat label="Binary" value={rNum.toString(2).padStart(8, "0")} /><Stat label="Class" value={[30, 90, 110].includes(rNum) ? "complex" : "—"} /><Equation tex={`s_i' = f(s_{i-1},\\,s_i,\\,s_{i+1}),\\quad \\text{rule} = ${rNum}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W * CELL} height={ROWS * CELL} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
