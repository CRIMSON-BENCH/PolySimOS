"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function DiceProbabilityStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dice, setDice] = useState(2);
  const [sides, setSides] = useState(6);
  const [target, setTarget] = useState(7);

  const N = Math.round(dice), S = Math.round(sides);
  let dist = [1]; for (let d = 0; d < N; d++) { const next = new Array(dist.length + S - 1).fill(0); for (let i = 0; i < dist.length; i++) for (let f = 1; f <= S; f++) next[i + f - 1] += dist[i]; dist = next; }
  const total = Math.pow(S, N); const pTarget = (dist[target - N] || 0) / total;
  const mostLikely = dist.indexOf(Math.max(...dist)) + N;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 300; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 30, oy = H - 35, pw = W - 50, ph = H - 55; const maxV = Math.max(...dist); const bw = pw / dist.length;
    dist.forEach((v, i) => { const sum = i + N; const h = (v / maxV) * ph; ctx.fillStyle = sum === target ? "#f472b6" : "#22d3ee"; ctx.fillRect(ox + i * bw, oy - h, bw - 1, h); if (dist.length <= 20) { ctx.fillStyle = "#64748b"; ctx.font = "9px sans-serif"; ctx.fillText(String(sum), ox + i * bw + 2, oy + 12); } });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`sum of ${N}d${S} distribution`, ox + 6, oy - ph + 12);
  }, [dice, sides, target]);

  return (
    <StudioChrome title="Dice Probability" tagline="the shape of chance"
      controls={<div>
        <Slider label="Number of dice" value={dice} min={1} max={8} step={1} onChange={setDice} />
        <Slider label="Sides per die" value={sides} min={2} max={20} step={1} onChange={setSides} />
        <Slider label="Target sum" value={target} min={N} max={N * S} step={1} onChange={setTarget} />
        <p className="mt-3 text-xs text-slate-500">Roll one die and every outcome is equally likely — a flat distribution. Roll several and sum them, and the shape becomes a bell: middle sums have many combinations, extremes have few. This is the central limit theorem in miniature, and why 7 is the most common roll of two dice and the heart of the game of craps.</p>
      </div>}
      inspector={<div><Stat label="P(sum = target)" value={`${(pTarget * 100).toFixed(2)}%`} /><Stat label="Most likely sum" value={String(mostLikely)} /><Stat label="Combinations" value={total.toLocaleString()} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
