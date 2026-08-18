"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const N = 130, CELL = 4;

const PRESETS: Record<string, { speed: number }> = {
  "Slow (watch it think)": { speed: 3 },
  "Normal": { speed: 20 },
  "Fast": { speed: 80 },
  "Turbo (reach highway)": { speed: 200 },
};

export function LangtonStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ speed }, update] = useShareableNumbers({ speed: 20 });
  const speedRef = useRef(speed); speedRef.current = speed;
  const [steps, setSteps] = useState(0);
  const grid = useRef<Uint8Array>(new Uint8Array(N * N));
  const ant = useRef({ x: (N / 2) | 0, y: (N / 2) | 0, dir: 0 }); // 0 up,1 right,2 down,3 left

  const reset = () => { grid.current = new Uint8Array(N * N); ant.current = { x: (N / 2) | 0, y: (N / 2) | 0, dir: 0 }; setSteps(0);
    const ctx = hidpi(canvasRef.current!, N * CELL, N * CELL); ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, N * CELL, N * CELL); };
  useEffect(reset, []);

  const frame = (mult: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = hidpi(canvas, N * CELL, N * CELL);
    const g = grid.current; const a = ant.current;
    const sp = speedRef.current;
    const dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0];
    for (let pass = 0; pass < mult; pass++) {
      for (let k = 0; k < sp; k++) {
        const i = a.y * N + a.x;
        if (g[i] === 0) { a.dir = (a.dir + 1) & 3; g[i] = 1; } else { a.dir = (a.dir + 3) & 3; g[i] = 0; }
        ctx.fillStyle = g[i] ? "#a3e635" : "#0b1220"; ctx.fillRect(a.x * CELL, a.y * CELL, CELL, CELL);
        a.x = (a.x + dx[a.dir] + N) % N; a.y = (a.y + dy[a.dir] + N) % N;
      }
    }
    ctx.fillStyle = "#f472b6"; ctx.fillRect(a.x * CELL, a.y * CELL, CELL, CELL);
    setSteps((n) => n + sp * mult);
  };

  const t = useTransport(frame);

  const explain =
    steps < 500
      ? "Early on the trail is small and near-symmetric — the same two rules run every step, so the outcome is fully deterministic no matter the speed."
      : steps < 10000
      ? "You are in the chaotic phase: the pattern looks random and unpredictable, yet nothing random is happening — it is pure deterministic rule-following."
      : "Past ~10,000 steps the ant has locked into its periodic 104-step highway, escaping to infinity forever — order emerging spontaneously from two trivial rules.";

  const code = `import numpy as np
N = 130
g = np.zeros((N, N), dtype=int)
x = y = N // 2; d = 0
dx = [0, 1, 0, -1]; dy = [-1, 0, 1, 0]
for step in range(11000):
    if g[y, x] == 0:
        d = (d + 1) % 4; g[y, x] = 1   # white: turn right, flip
    else:
        d = (d + 3) % 4; g[y, x] = 0   # black: turn left, flip
    x = (x + dx[d]) % N; y = (y + dy[d]) % N
print("after 11,000 steps the ant has built its highway")`;

  return (
    <StudioChrome title="Langton's Ant" tagline="two rules, emergent order"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { reset(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <label className="text-xs text-slate-500">Speed (steps/frame)</label>
        <input type="range" min={1} max={200} value={speed} onChange={(e) => update({ speed: +e.target.value })} className="w-full" />
        <p className="mt-3 text-xs text-slate-500">Two rules: on white, turn right and flip the cell; on black, turn left and flip. After about 10,000 steps of apparent chaos, the ant spontaneously builds a periodic highway — order from simplicity.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Steps" value={steps.toLocaleString()} /><Stat label="Highway at" value="~10,000" /><Stat label="Grid" value={`${N}²`} /><Equation tex={`s_{n+1}=\\begin{cases}\\text{turn right},\\ c\\to1 & c=0\\ (\\text{white})\\\\[2pt]\\text{turn left},\\ c\\to0 & c=1\\ (\\text{black})\\end{cases}\\quad n=${steps}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={N * CELL} height={N * CELL} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
