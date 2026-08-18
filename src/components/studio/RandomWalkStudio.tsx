"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 480;

const PRESETS: Record<string, { n: number; step: number }> = {
  "Balanced": { n: 400, step: 2 },
  "Few, big steps": { n: 100, step: 5 },
  "Many, small steps": { n: 1000, step: 1 },
  "Crowd": { n: 1500, step: 3 },
};

export function RandomWalkStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const walkers = useRef<{ x: number; y: number }[]>([]);
  const [{ n, step }, update] = useShareableNumbers({ n: 400, step: 2 });
  const stepRef = useRef(step); stepRef.current = step;
  const [rms, setRms] = useState(0);
  const stepCount = useRef(0);

  const reset = () => {
    walkers.current = Array.from({ length: n }, () => ({ x: W / 2, y: H / 2 }));
    stepCount.current = 0;
    const canvas = canvasRef.current;
    if (canvas) { const ctx = hidpi(canvas, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H); }
  };
  useEffect(() => { reset(); /* eslint-disable-next-line */ }, [n]);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = hidpi(canvas, W, H);
    const stp = stepRef.current;
    const ws = walkers.current;
    ctx.fillStyle = "rgba(2,6,23,0.06)"; ctx.fillRect(0, 0, W, H);
    for (let s = 0; s < steps; s++) { stepCount.current++; for (const w of ws) { const a = Math.random() * Math.PI * 2; w.x += Math.cos(a) * stp; w.y += Math.sin(a) * stp; } }
    let sum = 0; for (const w of ws) { const dx = w.x - W / 2, dy = w.y - H / 2; sum += dx * dx + dy * dy; ctx.fillStyle = "rgba(34,211,238,0.7)"; ctx.fillRect(w.x, w.y, 2, 2); }
    setRms(Math.sqrt(sum / ws.length));
  };

  const t = useTransport(frame);

  const explain =
    step >= 4
      ? "Large steps make each walker cover ground fast, so the cloud reaches a big RMS radius in only a few frames."
      : step <= 1.5
      ? "Tiny steps mean slow spreading — the √t growth is gentle and the cloud stays compact far longer."
      : `With ${n} walkers the RMS distance grows as √(steps) — the defining signature of diffusion.`;

  const code = `import numpy as np
n, step = ${n}, ${step}
pos = np.zeros((n, 2))
for _ in range(200):
    a = np.random.uniform(0, 2 * np.pi, n)
    pos[:, 0] += np.cos(a) * step
    pos[:, 1] += np.sin(a) * step
rms = np.sqrt(np.mean(np.sum(pos ** 2, axis=1)))
print("rms distance:", rms)`;

  return (
    <StudioChrome title="Random Walk & Diffusion" tagline="Brownian motion · √t spreading"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { reset(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mb-3 text-xs text-slate-500">Hundreds of walkers start at the center and step randomly. The cloud spreads as √(time) — the signature of diffusion.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Walkers" value={n} min={50} max={1500} step={50} onChange={(v) => update({ n: v })} />
        <Slider label="Step size" value={step} min={1} max={6} step={0.5} onChange={(v) => update({ step: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Walkers" value={String(n)} /><Stat label="Steps" value={String(stepCount.current)} /><Stat label="RMS distance" value={rms.toFixed(1)} /><Stat label="Law" value="⟨r²⟩ ∝ t" /><Equation tex={`\\langle x\\rangle = 0,\\quad \\sqrt{\\langle x^2\\rangle} = d\\sqrt{N} = ${step}\\sqrt{${stepCount.current}} \\approx ${(step * Math.sqrt(stepCount.current)).toFixed(1)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
