"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";

const PRESETS: Record<string, { dice: number; sides: number; target: number }> = {
  "Two d6 (craps)": { dice: 2, sides: 6, target: 7 },
  "Single die (flat)": { dice: 1, sides: 6, target: 3 },
  "Bell curve (5d6)": { dice: 5, sides: 6, target: 17 },
  "Three d20": { dice: 3, sides: 20, target: 31 },
};

export function DiceProbabilityStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ dice, sides, target }, update] = useShareableNumbers({ dice: 2, sides: 6, target: 7 });

  const N = Math.round(dice), S = Math.round(sides);
  let dist = [1]; for (let d = 0; d < N; d++) { const next = new Array(dist.length + S - 1).fill(0); for (let i = 0; i < dist.length; i++) for (let f = 1; f <= S; f++) next[i + f - 1] += dist[i]; dist = next; }
  const total = Math.pow(S, N); const pTarget = (dist[target - N] || 0) / total;
  const mostLikely = dist.indexOf(Math.max(...dist)) + N;

  const explain =
    N === 1
      ? "A single die is a flat, uniform distribution — every face is equally likely, so no sum is favored over another."
      : Math.abs(target - mostLikely) <= 1
      ? `Your target sits right at the peak: sums near the mean of ${mostLikely} have the most combinations while the extremes have just one each — the central limit theorem in miniature.`
      : "Your target is out in the tail, far from the mean, so only a handful of combinations reach it — that is why extreme sums are rare and middle sums are common.";

  const code = `# distribution of the sum of ${N}d${S} by convolution
N, S, target = ${N}, ${S}, ${target}
dist = [1]
for _ in range(N):
    nxt = [0]*(len(dist)+S-1)
    for i, v in enumerate(dist):
        for f in range(1, S+1):
            nxt[i+f-1] += v
    dist = nxt
total = S**N
print("P(sum=target)", dist[target-N]/total)`;

  useEffect(() => {
    const W = 520, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 30, oy = H - 35, pw = W - 50, ph = H - 55; const maxV = Math.max(...dist); const bw = pw / dist.length;
    dist.forEach((v, i) => { const sum = i + N; const h = (v / maxV) * ph; ctx.fillStyle = sum === target ? "#f472b6" : "#22d3ee"; ctx.fillRect(ox + i * bw, oy - h, bw - 1, h); if (dist.length <= 20) { ctx.fillStyle = "#64748b"; ctx.font = "9px sans-serif"; ctx.fillText(String(sum), ox + i * bw + 2, oy + 12); } });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`sum of ${N}d${S} distribution`, ox + 6, oy - ph + 12);
  }, [dice, sides, target]);

  return (
    <StudioChrome title="Dice Probability" tagline="the shape of chance"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Number of dice" value={dice} min={1} max={8} step={1} onChange={(v) => update({ dice: v })} />
        <Slider label="Sides per die" value={sides} min={2} max={20} step={1} onChange={(v) => update({ sides: v })} />
        <Slider label="Target sum" value={target} min={N} max={N * S} step={1} onChange={(v) => update({ target: v })} />
        <p className="mt-3 text-xs text-slate-500">Roll one die and every outcome is equally likely — a flat distribution. Roll several and sum them, and the shape becomes a bell: middle sums have many combinations, extremes have few. This is the central limit theorem in miniature, and why 7 is the most common roll of two dice and the heart of the game of craps.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="P(sum = target)" value={`${(pTarget * 100).toFixed(2)}%`} /><Stat label="Most likely sum" value={String(mostLikely)} /><Stat label="Combinations" value={total.toLocaleString()} /><Equation tex={`E[\\text{sum}] = \\frac{n(d+1)}{2} = \\frac{${N}(${S}+1)}{2} = ${(N * (S + 1) / 2).toFixed(1)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
