"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { Equation } from "./Equation";
import { useShareableNumbers } from "@/lib/studioKit";

const RULE_PRESETS: Record<string, { rule: number }> = {
  "Rule 30 (chaos)": { rule: 30 },
  "Rule 90 (Sierpiński)": { rule: 90 },
  "Rule 110 (Turing)": { rule: 110 },
  "Rule 184 (traffic)": { rule: 184 },
};

export function CellularAutomataStudio() {
  const [mode, setMode] = useState<"elementary" | "life">("elementary");
  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["elementary", "life"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === m ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{m === "elementary" ? "Elementary (Rule N)" : "Conway's Life"}</button>)}
      </div>
      {mode === "elementary" ? <Elementary /> : <Life />}
    </div>
  );
}

function Elementary() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ rule }, update] = useShareableNumbers({ rule: 30 });
  const N = 201, ROWS = 200;
  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, N, ROWS);
    let row = new Uint8Array(N); row[Math.floor(N / 2)] = 1;
    const img = ctx.createImageData(N, ROWS);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < N; x++) { const i = (y * N + x) * 4; const on = row[x]; img.data[i] = on ? 34 : 2; img.data[i + 1] = on ? 211 : 6; img.data[i + 2] = on ? 238 : 23; img.data[i + 3] = 255; }
      const next = new Uint8Array(N);
      for (let x = 0; x < N; x++) { const l = row[(x - 1 + N) % N], c = row[x], r = row[(x + 1) % N]; const idx = (l << 2) | (c << 1) | r; next[x] = (rule >> idx) & 1; }
      row = next;
    }
    ctx.putImageData(img, 0, 0);
  }, [rule]);
  const explain =
    rule === 30
      ? "Rule 30 is chaotic: from a single seed it produces patterns random enough that Wolfram used its center column as a random-number generator."
      : rule === 90
      ? "Rule 90 is the XOR of its two neighbors, so from one black cell it draws a Sierpiński triangle — a fractal built by a one-line rule."
      : rule === 110
      ? "Rule 110 lives on the boundary between order and chaos and is proven Turing-complete: it can, in principle, emulate any computer."
      : rule === 184
      ? "Rule 184 is a traffic model — each cell acts like a car that advances only when the cell ahead is empty, reproducing jams and flow."
      : [45, 54, 60, 105, 106, 150].includes(rule)
      ? "This rule falls in Wolfram's complex class: expect nested or aperiodic structure rather than a simple repeating pattern."
      : "Most of the 256 rules settle into uniform or simply periodic output; only a handful sustain lasting complexity.";

  const code = `import numpy as np
rule = ${rule}
N, ROWS = 201, 200
row = np.zeros(N, dtype=int); row[N // 2] = 1
grid = [row.copy()]
for _ in range(ROWS - 1):
    nxt = np.zeros(N, dtype=int)
    for x in range(N):
        idx = (row[(x-1) % N] << 2) | (row[x] << 1) | row[(x+1) % N]
        nxt[x] = (rule >> idx) & 1
    row = nxt; grid.append(row.copy())
print(np.array(grid))  # ROWS x N evolution`;

  return (
    <StudioChrome title="Elementary Cellular Automaton" tagline={`Wolfram rule ${rule}`}
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">One rule, 256 possibilities. Rule 30 makes chaos; Rule 90 makes a Sierpiński triangle; Rule 110 is Turing-complete.</p>
        <Presets presets={Object.keys(RULE_PRESETS).map((label) => ({ label }))} onApply={(label) => update(RULE_PRESETS[label])} />
        <Slider label="Rule number" value={rule} min={0} max={255} step={1} onChange={(v) => update({ rule: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Rule" value={String(rule)} /><Stat label="Cells" value={String(N)} /><Stat label="Class" value={rule === 30 || rule === 110 ? "chaotic/complex" : "structured"} /><Equation tex={`s_i' = f(s_{i-1},\\,s_i,\\,s_{i+1}),\\quad \\text{rule} = ${rule}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={N} height={ROWS} className="mx-auto h-auto max-h-[440px] rounded-lg" style={{ imageRendering: "pixelated", width: "440px" }} /></StudioChrome>
  );
}

function Life() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Uint8Array>(new Uint8Array(120 * 120));
  const frameCount = useRef(0);
  const [gen, setGen] = useState(0);
  const N = 120;
  const seed = () => { const g = new Uint8Array(N * N); for (let i = 0; i < N * N; i++) g[i] = Math.random() < 0.28 ? 1 : 0; gridRef.current = g; setGen(0); };
  useEffect(() => { seed(); }, []);
  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    for (let s = 0; s < steps; s++) {
      frameCount.current++;
      if (frameCount.current % 3 === 0) {
        const g = gridRef.current;
        const n = new Uint8Array(N * N);
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (dx || dy) c += g[((y + dy + N) % N) * N + (x + dx + N) % N]; } const alive = g[y * N + x]; n[y * N + x] = (alive && (c === 2 || c === 3)) || (!alive && c === 3) ? 1 : 0; }
        gridRef.current = n; setGen((v) => v + 1);
      }
    }
    const img = ctx.createImageData(N, N);
    const gg = gridRef.current;
    for (let i = 0; i < N * N; i++) { const on = gg[i]; img.data[i * 4] = on ? 163 : 2; img.data[i * 4 + 1] = on ? 230 : 6; img.data[i * 4 + 2] = on ? 53 : 23; img.data[i * 4 + 3] = 255; }
    ctx.putImageData(img, 0, 0);
  };
  const t = useTransport(frame);
  const explain = gen === 0
    ? "Starting from a random 28%-density soup — watch most cells die off in the first few generations before stable still-lifes and oscillators survive."
    : "Birth on exactly 3 neighbors, survival on 2 or 3: these two rules alone yield gliders, oscillators, and even Turing-complete computation.";

  const code = `import numpy as np
N = 120
g = (np.random.rand(N, N) < 0.28).astype(int)
def step(g):
    nb = sum(np.roll(np.roll(g, dy, 0), dx, 1)
             for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dx or dy))
    return ((g & ((nb == 2) | (nb == 3))) | (~g.astype(bool) & (nb == 3))).astype(int)
for _ in range(100):
    g = step(g)
print(g.sum(), "live cells after 100 generations")`;

  return (
    <StudioChrome title="Conway's Game of Life" tagline="cellular automaton · emergent complexity"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { seed(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="text-xs text-slate-500">Four simple rules produce gliders, oscillators, and endless emergent structure.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Grid" value={`${N}×${N}`} /><Stat label="Generation" value={String(gen)} /><Equation tex={`\\text{B3/S23:}\\quad \\text{birth if } n=3,\\ \\text{survive if } n\\in\\{2,3\\}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={N} height={N} className="mx-auto h-auto max-h-[440px] rounded-lg" style={{ imageRendering: "pixelated", width: "440px" }} /></StudioChrome>
  );
}
