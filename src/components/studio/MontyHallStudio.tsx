"use client";

import { useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { hidpi } from "@/lib/studioKit";

export function MontyHallStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stats = useRef({ switchWins: 0, stayWins: 0, games: 0 });
  const [, force] = useState(0);
  const seedRef = useRef(7);

  const reset = () => { stats.current = { switchWins: 0, stayWins: 0, games: 0 }; seedRef.current = 7; };

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let s = seedRef.current; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; seedRef.current = s; return s / 4294967296; };
    for (let fr = 0; fr < steps; fr++) for (let k = 0; k < 20; k++) { const car = (rnd() * 3) | 0; const pick = (rnd() * 3) | 0; if (pick === car) stats.current.stayWins++; else stats.current.switchWins++; stats.current.games++; }
    force((n) => n + 1);
    const W = 500, H = 240; const ctx = hidpi(canvas, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const g = stats.current.games || 1; const sw = stats.current.switchWins / g, st = stats.current.stayWins / g;
    const barY = 80; ctx.fillStyle = "#a3e635"; ctx.fillRect(60, barY, sw * (W - 120), 40); ctx.fillStyle = "#f472b6"; ctx.fillRect(60, barY + 70, st * (W - 120), 40);
    ctx.fillStyle = "#e2e8f0"; ctx.font = "12px sans-serif"; ctx.fillText(`switch: ${(sw * 100).toFixed(1)}%`, 60, barY - 6); ctx.fillText(`stay: ${(st * 100).toFixed(1)}%`, 60, barY + 64);
    ctx.strokeStyle = "#475569"; ctx.setLineDash([3, 3]); const x66 = 60 + (2 / 3) * (W - 120); ctx.beginPath(); ctx.moveTo(x66, 60); ctx.lineTo(x66, barY + 120); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#94a3b8"; ctx.fillText("2/3", x66 - 8, 56);
  };

  const t = useTransport(frame);

  const g = stats.current.games || 1;
  const swRate = stats.current.switchWins / g * 100;
  const explain = stats.current.games < 200
    ? "Early on the two rates jitter around 50% because the sample is tiny — let it run and the switch rate climbs toward its true 66.7%."
    : `Across ${stats.current.games.toLocaleString()} games the switch rate is holding near 2/3 (${swRate.toFixed(1)}%): your first pick is right only 1/3 of the time, so once the host reveals a losing door the remaining 2/3 of the probability piles onto the door you did not choose.`;
  const code = `import random
switch_wins = stay_wins = 0
N = 100_000
for _ in range(N):
    car = random.randrange(3)
    pick = random.randrange(3)
    stay_wins += (pick == car)      # keeping the first pick
    switch_wins += (pick != car)    # switching after a losing door opens
print("switch", switch_wins / N, "stay", stay_wins / N)`;
  return (
    <StudioChrome title="Monty Hall Problem" tagline="always switch"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { reset(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mt-3 text-xs text-slate-500">Pick one of three doors; the host, who knows where the car is, opens a losing door and offers a switch. Should you? Yes — switching wins two times out of three. Your first pick is right only 1/3 of the time, so the other 2/3 of the probability collapses onto the remaining door. The simulation converges to exactly that, however stubborn intuition is.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Games" value={stats.current.games.toLocaleString()} /><Stat label="Switch win rate" value={`${(stats.current.switchWins / g * 100).toFixed(1)}%`} /><Stat label="Stay win rate" value={`${(stats.current.stayWins / g * 100).toFixed(1)}%`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={240} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
