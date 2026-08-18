"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const N = 6;

const PRESETS: Record<string, { gamma: number; step: number }> = {
  "Far-sighted": { gamma: 0.99, step: -0.04 },
  "Short-sighted": { gamma: 0.6, step: -0.04 },
  "Rush to goal": { gamma: 0.9, step: -0.2 },
  "Patient explorer": { gamma: 0.95, step: -0.01 },
};

export function QLearningStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ gamma, step }, update] = useShareableNumbers({ gamma: 0.9, step: -0.04 });
  const goal = [N - 1, 0], trap = [N - 1, 1], wall = [2, 2];
  const reward = (i: number, j: number) => (i === goal[0] && j === goal[1]) ? 1 : (i === trap[0] && j === trap[1]) ? -1 : step;
  // value iteration
  const V: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
  const term = (i: number, j: number) => (i === goal[0] && j === goal[1]) || (i === trap[0] && j === trap[1]);
  const moves = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  for (let it = 0; it < 80; it++) { const nV = V.map(r => r.slice()); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { if (term(i, j) || (i === wall[0] && j === wall[1])) { nV[i][j] = term(i, j) ? reward(i, j) : 0; continue; } let best = -1e9; for (const [di, dj] of moves) { let ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N || (ni === wall[0] && nj === wall[1])) { ni = i; nj = j; } best = Math.max(best, V[ni][nj]); } nV[i][j] = reward(i, j) + gamma * best; } for (let i = 0; i < N; i++) V[i] = nV[i]; }

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cell = 46, ox = (W - N * cell) / 2, oy = 20;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x = ox + i * cell, y = oy + j * cell; let col = "#0f172a";
      if (i === goal[0] && j === goal[1]) col = "#166534"; else if (i === trap[0] && j === trap[1]) col = "#7f1d1d"; else if (i === wall[0] && j === wall[1]) col = "#334155"; else { const v = V[i][j]; col = v > 0 ? `rgba(34,211,238,${Math.min(0.6, v)})` : `rgba(244,114,182,${Math.min(0.6, -v)})`; }
      ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
      if (!term(i, j) && !(i === wall[0] && j === wall[1])) { let best = -1e9, ba = [0, 0]; for (const [di, dj] of moves) { let ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N || (ni === wall[0] && nj === wall[1])) { ni = i; nj = j; } if (V[ni][nj] > best) { best = V[ni][nj]; ba = [di, dj]; } } ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 2; const mx = x + cell / 2, my = y + cell / 2; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + ba[0] * 12, my + ba[1] * 12); ctx.stroke(); }
    }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("learned policy — arrows point to the goal (green), avoid trap (red)", ox, H - 8);
  }, [gamma, step]);

  const explain =
    step < -0.1
      ? `A steep step penalty (${step}) makes every move costly, so the policy rushes straight to the goal along the shortest safe path.`
      : gamma >= 0.95
      ? `A high discount γ=${gamma} makes the agent value the distant goal strongly, so even far cells earn positive value and paths stay deliberate.`
      : gamma < 0.7
      ? `A low discount γ=${gamma} makes the agent short-sighted — far-off reward is heavily discounted, so cells away from the goal stay near zero.`
      : `With γ=${gamma} and a mild step reward, the agent balances path length against reaching the goal, favoring a steady route.`;

  const code = `import numpy as np
N, gamma, step = 6, ${gamma}, ${step}
goal, trap, wall = (N-1, 0), (N-1, 1), (2, 2)
V = np.zeros((N, N))
moves = [(0,1),(0,-1),(1,0),(-1,0)]
def term(i, j): return (i, j) == goal or (i, j) == trap
for _ in range(80):
    nV = V.copy()
    for i in range(N):
        for j in range(N):
            if term(i, j) or (i, j) == wall:
                nV[i, j] = (1 if (i, j) == goal else -1) if term(i, j) else 0
                continue
            best = -1e9
            for di, dj in moves:
                ni, nj = i + di, j + dj
                if ni < 0 or nj < 0 or ni >= N or nj >= N or (ni, nj) == wall:
                    ni, nj = i, j
                best = max(best, V[ni, nj])
            r = 1 if (i, j) == goal else -1 if (i, j) == trap else step
            nV[i, j] = r + gamma * best
    V = nV
print(V.round(2))`;

  return (
    <StudioChrome title="Q-Learning Gridworld" tagline="learning to reach a goal"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Discount factor γ" value={gamma} min={0.5} max={0.99} step={0.01} onChange={(v) => update({ gamma: v })} />
        <Slider label="Step reward" value={step} min={-0.2} max={0} step={0.01} onChange={(v) => update({ step: v })} />
        <p className="mt-3 text-xs text-slate-500">Reinforcement learning finds a policy — an arrow in every cell — that maximizes long-term reward. A high discount γ makes the agent value the distant goal; a costlier step reward pushes it to take the shortest path. The colors show each cell&apos;s learned value. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Discount γ" value={gamma.toFixed(2)} />
        <Stat label="Start-cell value" value={V[0][N - 1].toFixed(2)} />
        <Stat label="Behavior" value={step < -0.1 ? "rushes to goal" : "cautious path"} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
