"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 440;

const PRESETS: Record<string, { n: number; spread: number }> = {
  "Few pendulums": { n: 8, spread: 6 },
  "Classic 15": { n: 15, spread: 4 },
  "Many pendulums": { n: 30, spread: 3 },
  "Fast cycle": { n: 18, spread: 8 },
};

export function PendulumWaveStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [{ n, spread }, update] = useShareableNumbers({ n: 18, spread: 4 });
  const t = useRef(0);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    const loop = () => {
      if (running) t.current += 0.016;
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const margin = 60, topY = 30, maxLen = H - 90;
      for (let i = 0; i < n; i++) {
        const osc = 30 + i * spread; const period = 60 / osc; const w = (2 * Math.PI) / period;
        const len = maxLen * (period * period) / ((60 / 30) * (60 / 30));
        const L = 80 + (i / (n - 1)) * (maxLen - 80);
        const ang = 0.5 * Math.cos(w * t.current * 6);
        const px = margin + (i / (n - 1)) * (W - 2 * margin);
        const bx = px + Math.sin(ang) * L, by = topY + Math.cos(ang) * L;
        ctx.strokeStyle = "rgba(148,163,184,0.3)"; ctx.beginPath(); ctx.moveTo(px, topY); ctx.lineTo(bx, by); ctx.stroke();
        ctx.fillStyle = `hsl(${190 - (i / n) * 150},85%,60%)`; ctx.beginPath(); ctx.arc(bx, by, 9, 0, 7); ctx.fill();
        void len;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [running, n, spread]);

  const slowOsc = 30;
  const fastOsc = 30 + (n - 1) * spread;
  const basePeriod = 60 / slowOsc;
  const fastPeriod = 60 / fastOsc;

  const explain =
    `Each of the ${n} pendulums is set to a slightly different length, so its period drifts from the ` +
    `slowest (~${basePeriod.toFixed(2)}s, ${slowOsc} swings per cycle) to the fastest (~${fastPeriod.toFixed(2)}s, ` +
    `${fastOsc} swings per cycle). With a period spread of ${spread}, the phases fan out into a traveling wave, ` +
    `dissolve into a chaos-looking scramble, and then all re-sync at the common 60-unit cycle before repeating. ` +
    `Wider spread reaches the disordered stage sooner; more pendulums makes the wave smoother.`;

  const code = `import numpy as np
n, spread = ${n}, ${spread}
i = np.arange(n)
osc = 30 + i * spread          # swings per common 60-unit cycle
period = 60 / osc              # each pendulum's period
w = 2 * np.pi / period         # angular frequency
t = np.linspace(0, 60, 2000)   # one full re-sync cycle
# phase of every pendulum over time from its graded length/period
theta = 0.5 * np.cos(np.outer(w, t) * 6)   # shape (n, len(t))
print("periods:", period.round(3))
print("re-sync at t = 60 (all phases align)")`;

  return (
    <StudioChrome title="Pendulum Wave" tagline="phase art from many periods"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button><button onClick={() => (t.current = 0)} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Restart</button></div>
        <p className="mb-3 text-xs text-slate-500">A row of pendulums with slightly different lengths. They drift in and out of phase, weaving traveling waves, then briefly snap back into sync.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Pendulums" value={n} min={8} max={30} step={1} onChange={(v) => update({ n: v })} />
        <Slider label="Period spread" value={spread} min={1} max={8} step={0.5} onChange={(v) => update({ spread: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Pendulums" value={String(n)} />
        <Stat label="Slowest period" value={`${basePeriod.toFixed(2)} s`} />
        <Stat label="Fastest period" value={`${fastPeriod.toFixed(2)} s`} />
        <Stat label="Effect" value="phase waves" />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
