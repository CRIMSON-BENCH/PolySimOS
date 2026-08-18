"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

// Simulated annealing minimizing a rugged 1D landscape.
const f = (x: number) => Math.sin(x) * 2 + Math.sin(2.3 * x + 1) + Math.sin(0.7 * x) * 1.5 + 0.02 * (x - 8) ** 2;

const PRESETS: Record<string, { coolRate: number }> = {
  "Glacial 0.999": { coolRate: 0.999 },
  "Slow 0.997": { coolRate: 0.997 },
  "Moderate 0.99": { coolRate: 0.99 },
  "Fast quench 0.96": { coolRate: 0.96 },
};

export function SimulatedAnnealingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ coolRate }, update] = useShareableNumbers({ coolRate: 0.995 });
  const [seed, setSeed] = useState(1);
  const [state, setState] = useState({ x: 8, best: 8, T: 5, bestF: 0 });
  const coolRef = useRef(coolRate); coolRef.current = coolRate;
  const sim = useRef({ s: 0, x: 8, T: 5, bestX: 8, bestF: 0 });

  // Reseed the anneal whenever the Restart control (seed) fires — a separate reseed effect.
  useEffect(() => {
    let s = seed * 4133 >>> 0;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const x = rnd() * 16, T = 5, bestX = x, bestF = f(x);
    sim.current = { s, x, T, bestX, bestF };
    setState({ x, best: bestX, T, bestF });
  }, [seed]);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const st = sim.current; const cool = coolRef.current;
    let s = st.s;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    let x = st.x, T = st.T, bestX = st.bestX, bestF = st.bestF;
    for (let k = 0; k < 8 * steps; k++) { const nx = Math.max(0, Math.min(16, x + (rnd() - 0.5) * T * 2)); const dE = f(nx) - f(x); if (dE < 0 || rnd() < Math.exp(-dE / T)) x = nx; if (f(x) < bestF) { bestF = f(x); bestX = x; } T *= cool; if (T < 0.01) T = 0.01; }
    st.s = s; st.x = x; st.T = T; st.bestX = bestX; st.bestF = bestF;
    setState({ x, best: bestX, T, bestF });
    const W = 540, H = 300; const ctx = hidpi(canvas, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 20, oy = H - 40, pw = W - 40, ph = H - 70; const X = (xx: number) => ox + (xx / 16) * pw; let mn = Infinity, mx = -Infinity; for (let i = 0; i <= 100; i++) { const v = f(i / 100 * 16); mn = Math.min(mn, v); mx = Math.max(mx, v); }
    const Y = (v: number) => oy - ((v - mn) / (mx - mn)) * ph;
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 200; i++) { const xx = i / 200 * 16; i ? ctx.lineTo(X(xx), Y(f(xx))) : ctx.moveTo(X(xx), Y(f(xx))); } ctx.stroke();
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(X(x), Y(f(x)), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(X(bestX), Y(bestF), 4, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`T = ${T.toFixed(2)} — pink = current, green = best`, ox, 18);
  };

  const t = useTransport(frame);

  const explain =
    coolRate >= 0.998
      ? "Very slow cooling: the schedule keeps temperature high for many steps, so the walker explores widely and almost always reaches the global minimum — at the cost of speed."
      : coolRate <= 0.97
      ? "Aggressive quench: temperature collapses fast, so the walker freezes early and often gets trapped in whichever local valley it happened to be near."
      : "Balanced schedule: enough early wandering to escape shallow minima, then a steady settle toward the deepest valley found.";

  const code = `import numpy as np, math
cool = ${coolRate}
rng = np.random.default_rng(0)
f = lambda x: math.sin(x)*2 + math.sin(2.3*x+1) + math.sin(0.7*x)*1.5 + 0.02*(x-8)**2
x = rng.random()*16; T = 5.0; bestx = x; bestf = f(x)
for _ in range(4000):
    nx = min(16.0, max(0.0, x + (rng.random()-0.5)*T*2))
    dE = f(nx) - f(x)
    if dE < 0 or rng.random() < math.exp(-dE/T): x = nx
    if f(x) < bestf: bestf = f(x); bestx = x
    T = max(0.01, T*cool)
print("best x", bestx, "best f", bestf)`;

  return (
    <StudioChrome title="Simulated Annealing" tagline="escaping local minima"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { setSeed((k) => k + 1); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Cooling rate" value={coolRate} min={0.95} max={0.999} step={0.001} onChange={(v) => update({ coolRate: v })} />
        <p className="mt-3 text-xs text-slate-500">Simulated annealing borrows from metallurgy: at high temperature it accepts worse moves freely, letting it jump out of local minima; as it cools, it settles into the best valley it found. The acceptance probability exp(−ΔE/T) is the key. Cool too fast and it gets stuck; cool slowly and it finds the global optimum.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Temperature" value={state.T.toFixed(2)} /><Stat label="Current value" value={f(state.x).toFixed(3)} /><Stat label="Best found" value={state.bestF.toFixed(3)} /><Equation tex={`P=e^{-\\Delta E/T},\\quad T\\leftarrow \\alpha T,\\quad \\alpha=${coolRate},\\ T=${state.T.toFixed(2)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
