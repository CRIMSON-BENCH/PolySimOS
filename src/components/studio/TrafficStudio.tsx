"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const CELLS = 160, MAXV = 5, W = 760, H = 300;

const PRESETS: Record<string, { density: number; pSlow: number }> = {
  "Free flow (low density)": { density: 0.1, pSlow: 0.1 },
  "Onset of jams": { density: 0.25, pSlow: 0.3 },
  "Stop-and-go": { density: 0.35, pSlow: 0.45 },
  "Gridlock (high density)": { density: 0.6, pSlow: 0.3 },
};

export function TrafficStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lane = useRef<number[]>([]); // -1 empty, else speed
  const history = useRef<number[][]>([]);
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [{ density, pSlow }, update] = useShareableNumbers({ density: 0.3, pSlow: 0.25 });
  const [flow, setFlow] = useState(0);

  const seed = () => { const l = new Array(CELLS).fill(-1); for (let i = 0; i < CELLS; i++) if (Math.random() < density) l[i] = Math.floor(Math.random() * (MAXV + 1)); lane.current = l; history.current = []; };
  useEffect(() => { seed(); /* eslint-disable-next-line */ }, [density]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H); let moved = 0, cars = 0;
    const step = () => {
      const l = lane.current; const gap = (i: number) => { let d = 1; while (l[(i + d) % CELLS] < 0 && d <= MAXV + 1) d++; return d - 1; };
      const nv = new Array(CELLS).fill(-1); moved = 0; cars = 0;
      for (let i = 0; i < CELLS; i++) { if (l[i] < 0) continue; cars++; let v = Math.min(l[i] + 1, MAXV); v = Math.min(v, gap(i)); if (v > 0 && Math.random() < pSlow) v--; nv[(i + v) % CELLS] = v; moved += v; }
      lane.current = nv;
      history.current.push(nv.map((v) => (v < 0 ? -1 : v))); if (history.current.length > H) history.current.shift();
      setFlow(cars ? moved / cars : 0);
    };
    const loop = () => {
      if (running) step();
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const cw = W / CELLS; const hist = history.current;
      for (let y = 0; y < hist.length; y++) for (let x = 0; x < CELLS; x++) { const v = hist[y][x]; if (v < 0) continue; ctx.fillStyle = `hsl(${v / MAXV * 120},85%,55%)`; ctx.fillRect(x * cw, y, Math.max(1, cw), 1); }
      ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("time ↓ · red = jam, green = free-flowing", 10, H - 8);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [running, pSlow]);

  const explain =
    density <= 0.15
      ? "Low density: cars rarely meet, so traffic flows freely and nearly every car cruises near the max speed."
      : density < 0.3
      ? "Near the critical density: random braking now propagates. Spontaneous stop-and-go waves (phantom jams) drift backward through the pack with no obstacle at all."
      : density < 0.5
      ? "Above critical density: stop-and-go waves dominate. Average speed drops sharply — this is the falling branch of the fundamental diagram."
      : "High density: cars are packed too tightly to accelerate. Flow collapses toward gridlock and the ring crawls.";

  const code = `import numpy as np
CELLS, MAXV = ${CELLS}, ${MAXV}
density, p_slow = ${density}, ${pSlow}
rng = np.random.default_rng()
# -1 = empty cell, else the car's current speed
lane = np.where(rng.random(CELLS) < density,
                rng.integers(0, MAXV + 1, CELLS), -1)

def step(lane):
    nxt = np.full(CELLS, -1)
    for i in range(CELLS):
        if lane[i] < 0:
            continue
        # gap = free cells ahead (ring road wraps around)
        d = 1
        while lane[(i + d) % CELLS] < 0 and d <= MAXV + 1:
            d += 1
        gap = d - 1
        v = min(lane[i] + 1, MAXV, gap)     # accelerate, then brake for gap
        if v > 0 and rng.random() < p_slow:  # random (phantom-jam) braking
            v -= 1
        nxt[(i + v) % CELLS] = v
    return nxt

for _ in range(300):
    lane = step(lane)
cars = lane[lane >= 0]
print("avg speed", cars.mean() if cars.size else 0.0)`;

  return (
    <StudioChrome title="Traffic Flow Studio" tagline="Nagel–Schreckenberg model · phantom jams"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button><button onClick={seed} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reseed</button></div>
        <p className="mb-3 text-xs text-slate-500">A ring road of cars. Random braking alone creates {"“"}phantom{"”"} traffic jams that travel backward — no accident needed.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Density" value={density} min={0.05} max={0.6} step={0.05} onChange={(v) => update({ density: v })} />
        <Slider label="Random braking" value={pSlow} min={0} max={0.6} step={0.05} onChange={(v) => update({ pSlow: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Cells" value={String(CELLS)} /><Stat label="Avg speed" value={flow.toFixed(2)} /><Stat label="Density" value={density.toFixed(2)} /><Stat label="Model" value="Nagel–Schreckenberg" /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
