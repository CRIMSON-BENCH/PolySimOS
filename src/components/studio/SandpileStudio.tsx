"use client";

import { useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { TransportBar, useTransport } from "./Transport";
import { hidpi } from "@/lib/studioKit";

const N = 101, CELL = 5;
const COLORS = ["#0b1220", "#1e3a8a", "#0891b2", "#a3e635"];

export function SandpileStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grains, setGrains] = useState(0);
  const [avalanche, setAvalanche] = useState(0);
  const grid = useRef<Uint32Array>(new Uint32Array(N * N));
  const total = useRef(0);

  const reset = () => { grid.current = new Uint32Array(N * N); total.current = 0; setGrains(0); };

  const explain = avalanche > 200
    ? `A large cascade just toppled ${avalanche.toLocaleString()} cells — near the critical slope a single grain can trigger a system-spanning avalanche, with no typical size.`
    : avalanche > 0
    ? `The last drop toppled ${avalanche.toLocaleString()} cells; most avalanches are small, but their sizes follow a heavy power-law tail.`
    : `The pile is still filling toward its critical slope; once cells reach 4 grains, chain-reaction topples begin.`;

  const code = `import numpy as np
N = 101; g = np.zeros((N, N), int); c = N // 2
for _ in range(1000):
    g[c, c] += 1
    while (g >= 4).any():
        t = g // 4
        g -= t * 4
        g[1:, :] += t[:-1, :]; g[:-1, :] += t[1:, :]
        g[:, 1:] += t[:, :-1]; g[:, :-1] += t[:, 1:]
print("max height", int(g.max()))`;

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = grid.current;
    const c = ((N / 2) | 0) * N + ((N / 2) | 0);
    let toppled = 0;
    for (let pass = 0; pass < steps; pass++) {
      for (let drop = 0; drop < 30; drop++) { g[c]++; total.current++; }
      // relax (topple) until stable
      toppled = 0; let unstable = true, guard = 0;
      while (unstable && guard++ < 200) { unstable = false;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (g[i] >= 4) { const n4 = (g[i] / 4) | 0; g[i] -= n4 * 4; toppled += n4 * 4; unstable = true;
          if (x > 0) g[i - 1] += n4; if (x < N - 1) g[i + 1] += n4; if (y > 0) g[i - N] += n4; if (y < N - 1) g[i + N] += n4; } } }
    }
    setGrains(total.current); setAvalanche(toppled);
    const ctx = hidpi(canvas, N * CELL, N * CELL);
    for (let i = 0; i < N * N; i++) { ctx.fillStyle = COLORS[Math.min(3, g[i])]; ctx.fillRect((i % N) * CELL, ((i / N) | 0) * CELL, CELL, CELL); }
  };

  const t = useTransport(frame);

  return (
    <StudioChrome title="Abelian Sandpile" tagline="self-organized criticality"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { reset(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mt-3 text-xs text-slate-500">Grains drop on the center cell. When a cell reaches 4 grains it topples, sending one to each neighbor — which can trigger chain-reaction avalanches. The pile self-organizes into an intricate fractal at the critical slope.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Grains added" value={grains.toLocaleString()} /><Stat label="Last avalanche" value={avalanche.toLocaleString()} /><Stat label="Topple at" value="4 grains" /><Equation tex={`z_{ij} \\geq 4:\\ z_{ij} \\to z_{ij}-4,\\ z_{\\text{nbr}} \\to z_{\\text{nbr}}+1;\\ \\text{grains}=${grains}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={N * CELL} height={N * CELL} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
