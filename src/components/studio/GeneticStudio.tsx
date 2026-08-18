"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { popSize: number; mutation: number }> = {
  "Explore (high mutation)": { popSize: 120, mutation: 0.3 },
  "Exploit (low mutation)": { popSize: 120, mutation: 0.02 },
  "Small tribe": { popSize: 30, mutation: 0.1 },
  "Big diverse pop": { popSize: 200, mutation: 0.08 },
};

// Evolve (x,y) to maximize a multi-peak fitness landscape.
export function GeneticStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ popSize, mutation }, update] = useShareableNumbers({ popSize: 80, mutation: 0.08 });
  const mutationRef = useRef(mutation); mutationRef.current = mutation;
  const [seed, setSeed] = useState(1);
  const [gen, setGen] = useState(0);
  const [best, setBest] = useState(0);
  const pop = useRef<[number, number][]>([]);
  const rngRef = useRef(918);

  const W = 460, H = 400;
  const fit = (x: number, y: number) => { const gx = x / W, gy = y / H;
    return Math.exp(-((gx - 0.7) ** 2 + (gy - 0.3) ** 2) / 0.02) + 0.8 * Math.exp(-((gx - 0.25) ** 2 + (gy - 0.7) ** 2) / 0.03) + 0.6 * Math.exp(-((gx - 0.5) ** 2 + (gy - 0.5) ** 2) / 0.05); };

  const init = () => { let s = seed * 22699 >>> 0; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    pop.current = Array.from({ length: Math.round(popSize) }, () => [r() * W, r() * H] as [number, number]); setGen(0); };
  useEffect(init, [popSize, seed]);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rnd = () => { rngRef.current = (rngRef.current * 1664525 + 1013904223) >>> 0; return rngRef.current / 4294967296; };
    const mut = mutationRef.current;
    let lastBest = 0;
    for (let s = 0; s < steps; s++) {
      const scored = pop.current.map((p) => [p, fit(p[0], p[1])] as [[number, number], number]).sort((a, b) => b[1] - a[1]);
      lastBest = scored[0][1];
      const elite = scored.slice(0, Math.max(2, (scored.length * 0.3) | 0)).map((s2) => s2[0]);
      const next: [number, number][] = [...elite];
      while (next.length < pop.current.length) { const a = elite[(rnd() * elite.length) | 0], b = elite[(rnd() * elite.length) | 0];
        let nx = rnd() < 0.5 ? a[0] : b[0], ny = rnd() < 0.5 ? a[1] : b[1];
        if (rnd() < mut) nx += (rnd() - 0.5) * W * 0.2; if (rnd() < mut) ny += (rnd() - 0.5) * H * 0.2;
        next.push([Math.max(0, Math.min(W, nx)), Math.max(0, Math.min(H, ny))]); }
      pop.current = next;
    }
    setBest(lastBest); setGen((g) => g + steps);
    const ctx = hidpi(canvas, W, H); const img = ctx.createImageData(W, H);
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const v = Math.min(1, fit(x, y)); for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const idx = ((y + dy) * W + (x + dx)) * 4; img.data[idx] = 11 + v * 60; img.data[idx + 1] = 18 + v * 120; img.data[idx + 2] = 32 + v * 90; img.data[idx + 3] = 255; } }
    ctx.putImageData(img, 0, 0);
    pop.current.forEach((p) => { ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, 7); ctx.fillStyle = "#f472b6"; ctx.fill(); });
  };

  const t = useTransport(frame);

  const explain =
    mutation >= 0.25
      ? `High mutation (${mutation}): the swarm explores widely and resists getting stuck in a local peak, but jitters around the optimum instead of settling precisely.`
      : mutation <= 0.03
      ? `Low mutation (${mutation}): the population converges fast and sharply, but risks locking onto a nearby local peak instead of the global best.`
      : `Balanced mutation (${mutation}) with population ${Math.round(popSize)}: enough diversity to escape local optima while still converging — the classic explore-vs-exploit sweet spot.`;

  const code = `import numpy as np
pop_size, mutation = ${Math.round(popSize)}, ${mutation}
def fit(x, y):
    return (np.exp(-((x-0.7)**2+(y-0.3)**2)/0.02)
            + 0.8*np.exp(-((x-0.25)**2+(y-0.7)**2)/0.03)
            + 0.6*np.exp(-((x-0.5)**2+(y-0.5)**2)/0.05))
pop = np.random.rand(pop_size, 2)
for _ in range(100):
    order = np.argsort([-fit(*p) for p in pop])
    elite = pop[order[:max(2, int(pop_size*0.3))]]
    kids = elite[np.random.randint(len(elite), size=(pop_size, 2)), [0, 1]]
    kids += (np.random.rand(pop_size, 2) < mutation) * (np.random.rand(pop_size, 2)-0.5)*0.2
    pop = np.clip(kids, 0, 1)
print("best", max(fit(*p) for p in pop))`;

  return (
    <StudioChrome title="Genetic Algorithm" tagline="evolution as optimization"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { init(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Population" value={popSize} min={20} max={200} step={10} onChange={(v) => update({ popSize: v })} />
        <Slider label="Mutation rate" value={mutation} min={0.01} max={0.4} step={0.01} onChange={(v) => update({ mutation: v })} />
        <p className="mt-3 text-xs text-slate-500">A population of candidate solutions is scored by fitness (bright = high). The fittest are selected, crossed over, and mutated each generation. Watch the swarm climb toward the global peak while dodging local optima.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Generation" value={String(gen)} /><Stat label="Best fitness" value={best.toFixed(3)} /><Stat label="Population" value={String(Math.round(popSize))} /><Equation tex={`P_i = \\frac{f_i}{\\sum_j f_j}, \\quad \\mu = ${mutation}, \\quad f_{\\max} = ${best.toFixed(3)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={460} height={400} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
