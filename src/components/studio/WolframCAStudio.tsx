"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 401, ROWS = 200, CELL = 2;

export function WolframCAStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rule, setRule] = useState(30);
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

  return (
    <StudioChrome title="Elementary Cellular Automata" tagline="Wolfram's 256 rules"
      controls={<div>
        <Slider label="Rule number" value={rule} min={0} max={255} step={1} onChange={setRule} />
        <div className="mt-3 flex flex-wrap gap-2">{[30, 90, 110, 54, 150, 184].map((r) => <button key={r} onClick={() => setRule(r)} className={`rounded-lg px-2 py-1 text-xs font-semibold ${Math.round(rule) === r ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>Rule {r}</button>)}</div>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" checked={random} onChange={(e) => setRandom(e.target.checked)} /> Random initial row</label>
        {random && <button onClick={() => setSeed((n) => n + 1)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reseed</button>}
        <p className="mt-3 text-xs text-slate-500">Each cell&apos;s next state depends only on itself and its two neighbors, giving 256 possible rules. Rule 30 is chaotic (used as a random generator); Rule 110 is proven Turing-complete; Rule 90 draws a Sierpinski triangle.</p>
      </div>}
      inspector={<div><Stat label="Rule" value={String(Math.round(rule))} /><Stat label="Binary" value={Math.round(rule).toString(2).padStart(8, "0")} /><Stat label="Class" value={[30, 90, 110].includes(Math.round(rule)) ? "complex" : "—"} /></div>}
    ><canvas ref={canvasRef} width={W * CELL} height={ROWS * CELL} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
