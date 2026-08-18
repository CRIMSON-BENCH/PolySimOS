"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Single-elimination bracket: champion probability from seed strength.
export function TournamentStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spread, setSpread] = useState(200); // Elo spread between seeds
  const [seed, setSeed] = useState(1);

  const N = 8; const ratings = Array.from({ length: N }, (_, i) => 1600 - i * spread / N);
  const pWin = (a: number, b: number) => 1 / (1 + Math.pow(10, (ratings[b] - ratings[a]) / 400));
  // champion probability via recursion over rounds (simplified: simulate many)
  let s = seed * 999 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const champCount = new Array(N).fill(0); const TRIALS = 4000;
  for (let t = 0; t < TRIALS; t++) { let alive = [0, 1, 2, 3, 4, 5, 6, 7]; while (alive.length > 1) { const next: number[] = []; for (let i = 0; i < alive.length; i += 2) { const a = alive[i], b = alive[i + 1]; next.push(rnd() < pWin(a, b) ? a : b); } alive = next; } champCount[alive[0]]++; }
  const champProb = champCount.map((c) => c / TRIALS);

  useEffect(() => {
    const W = 500, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    champProb.forEach((p, i) => { const y = 30 + i * 34; const bw = p * (W - 160); ctx.fillStyle = `hsl(${190 - i * 12},70%,55%)`; ctx.fillRect(120, y, bw, 22); ctx.fillStyle = "#e2e8f0"; ctx.font = "11px sans-serif"; ctx.textAlign = "right"; ctx.fillText(`Seed ${i + 1}`, 112, y + 16); ctx.textAlign = "left"; ctx.fillText(`${(p * 100).toFixed(0)}%`, 124 + bw, y + 16); });
    ctx.textAlign = "left"; ctx.fillStyle = "#94a3b8"; ctx.fillText("championship probability", 120, 18);
  }, [spread, seed]);

  return (
    <StudioChrome title="Tournament Bracket Odds" tagline="who wins it all?"
      controls={<div>
        <Slider label="Skill spread (Elo)" value={spread} min={0} max={600} step={20} onChange={setSpread} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">Re-simulate</button>
        <p className="mt-3 text-xs text-slate-500">In a single-elimination bracket, the best team is far from guaranteed to win — it must string together several wins, each a fresh chance to be upset. Simulating thousands of tournaments reveals the true championship odds for each seed. With little skill spread the field is wide open; with a big gap the top seed dominates, but even then rarely tops 50%.</p>
      </div>}
      inspector={<div><Stat label="Top seed odds" value={`${(champProb[0] * 100).toFixed(0)}%`} /><Stat label="Bottom seed odds" value={`${(champProb[N - 1] * 100).toFixed(1)}%`} /><Stat label="Teams" value={String(N)} /></div>}
    ><canvas ref={canvasRef} width={500} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
