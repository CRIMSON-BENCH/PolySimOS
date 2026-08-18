"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { useShareableNumbers } from "@/lib/studioKit";

const N = 200;

const PRESETS: Record<string, { perFrame: number }> = {
  "Slow (watch tips)": { perFrame: 20 },
  "Steady": { perFrame: 80 },
  "Fast": { perFrame: 150 },
  "Max flux": { perFrame: 200 },
};

export function DLAStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const grid = useRef<Uint8Array>(new Uint8Array(N * N));
  const stuckRef = useRef(1);
  const [{ perFrame }, update] = useShareableNumbers({ perFrame: 80 });
  const perFrameRef = useRef(perFrame); perFrameRef.current = perFrame;
  const [count, setCount] = useState(1);

  const seed = () => { const g = new Uint8Array(N * N); g[((N / 2) | 0) * N + ((N / 2) | 0)] = 1; grid.current = g; stuckRef.current = 1; setCount(1); };
  useEffect(() => { seed(); }, []);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!; const img = ctx.createImageData(N, N);
    const g = grid.current;
    const occupied = (x: number, y: number) => x >= 0 && y >= 0 && x < N && y < N && g[y * N + x] === 1;
    for (let w = 0; w < steps * perFrameRef.current; w++) {
      const ang = Math.random() * Math.PI * 2, R = N * 0.46; let x = Math.round(N / 2 + Math.cos(ang) * R), y = Math.round(N / 2 + Math.sin(ang) * R);
      for (let s = 0; s < 600; s++) {
        if (occupied(x + 1, y) || occupied(x - 1, y) || occupied(x, y + 1) || occupied(x, y - 1)) { if (x > 0 && y > 0 && x < N && y < N) { g[y * N + x] = 1; stuckRef.current++; } break; }
        x += (Math.random() * 3 | 0) - 1; y += (Math.random() * 3 | 0) - 1;
        const dx = x - N / 2, dy = y - N / 2; if (dx * dx + dy * dy > (N * 0.49) ** 2) break;
      }
    }
    setCount(stuckRef.current);
    for (let i = 0; i < N * N; i++) { const on = g[i]; img.data[i * 4] = on ? 34 : 2; img.data[i * 4 + 1] = on ? 211 : 6; img.data[i * 4 + 2] = on ? 238 : 23; img.data[i * 4 + 3] = 255; }
    ctx.putImageData(img, 0, 0);
  };

  const t = useTransport(frame);

  const explain =
    perFrame <= 40
      ? "Few walkers per frame: growth is slow enough to watch each particle wander in and stick to a tip — the interior stays shielded from newcomers."
      : perFrame >= 150
      ? "Many walkers per frame: the cluster fills fast, yet the branching pattern and its fractal dimension (≈ 1.71) stay the same — flux sets the pace, not the shape."
      : "Each walker sticks on first contact, so exposed tips capture particles before they reach the interior (screening) — that feedback is what makes the cluster branch as an open fractal.";

  const code = `import numpy as np
N, per_frame = ${N}, ${perFrame}
grid = np.zeros((N, N), np.uint8); grid[N // 2, N // 2] = 1
def occupied(x, y):
    return 0 <= x < N and 0 <= y < N and grid[y, x] == 1
for _ in range(per_frame):
    ang = np.random.rand() * 2 * np.pi; Rr = N * 0.46
    x = round(N / 2 + np.cos(ang) * Rr); y = round(N / 2 + np.sin(ang) * Rr)
    for _ in range(600):
        if occupied(x + 1, y) or occupied(x - 1, y) or occupied(x, y + 1) or occupied(x, y - 1):
            grid[y, x] = 1; break
        x += np.random.randint(3) - 1; y += np.random.randint(3) - 1
print("cluster size", int(grid.sum()))`;

  return (
    <StudioChrome title="Diffusion-Limited Aggregation" tagline="fractal growth · Brownian sticking"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { seed(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mb-3 text-xs text-slate-500">Particles wander randomly from the edge and stick where they touch the cluster. The result is a branching fractal — like frost, coral, and mineral dendrites.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Speed (walkers/frame)" value={perFrame} min={10} max={200} step={10} onChange={(v) => update({ perFrame: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Cluster size" value={count.toLocaleString()} /><Stat label="Grid" value={`${N}×${N}`} /><Stat label="Fractal dim." value="≈ 1.71" /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={N} height={N} className="mx-auto h-auto max-h-[440px] rounded-lg" style={{ imageRendering: "pixelated", width: "440px" }} /></StudioChrome>
  );
}
