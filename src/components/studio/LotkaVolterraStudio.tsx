"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { a: number; b: number; c: number; d: number }> = {
  "Classic cycle": { a: 1.0, b: 0.1, c: 1.5, d: 0.075 },
  "Predator crash": { a: 1.0, b: 0.1, c: 2.5, d: 0.05 },
  "Prey boom": { a: 1.8, b: 0.04, c: 1.5, d: 0.075 },
  "Near-equilibrium": { a: 0.5, b: 0.1, c: 1.0, d: 0.1 },
};

// Lotka-Volterra predator-prey ODE with time series + phase portrait.
export function LotkaVolterraStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ a, b, c, d }, update] = useShareableNumbers({ a: 1.0, b: 0.1, c: 1.5, d: 0.075 });

  useEffect(() => {
    const W = 540, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    let x = 10, y = 5; const dt = 0.01; const xs: number[] = [], ys: number[] = [];
    for (let t = 0; t < 4000; t++) { const dx = a * x - b * x * y, dy = -c * y + d * x * y; x += dx * dt; y += dy * dt; if (t % 4 === 0) { xs.push(x); ys.push(y); } }
    // time series (left 60%)
    const ox = 30, oy = 160, pw = 300, ph = 130; const mx = Math.max(...xs, ...ys) * 1.1;
    ctx.strokeStyle = "#334155"; ctx.strokeRect(ox, oy - ph, pw, ph);
    const plot = (arr: number[], col: string) => { ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); arr.forEach((v, i) => { const px = ox + (i / arr.length) * pw; const py = oy - (v / mx) * ph; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.stroke(); };
    plot(xs, "#22d3ee"); plot(ys, "#f472b6");
    ctx.font = "11px sans-serif"; ctx.fillStyle = "#22d3ee"; ctx.fillText("prey", ox + 6, oy - ph + 14); ctx.fillStyle = "#f472b6"; ctx.fillText("predator", ox + 50, oy - ph + 14);
    // phase portrait (right)
    const px0 = 360, py0 = 300, ppw = 160, pph = 260;
    ctx.strokeStyle = "#334155"; ctx.strokeRect(px0, py0 - pph, ppw, pph);
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 1.5; ctx.beginPath(); xs.forEach((xv, i) => { const gx = px0 + (xv / mx) * ppw; const gy = py0 - (ys[i] / mx) * pph; i ? ctx.lineTo(gx, gy) : ctx.moveTo(gx, gy); }); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.fillText("phase portrait", px0 + 6, py0 - pph + 14); ctx.fillText("prey →", px0 + ppw - 44, py0 + 14); ctx.save(); ctx.translate(px0 - 6, py0 - pph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("predator", -24, 0); ctx.restore();
  }, [a, b, c, d]);

  const preyEq = c / d;
  const predEq = a / b;
  const explain =
    `These parameters trace a closed orbit: prey and predator populations cycle forever without settling, staying about a quarter-period out of phase — the predator peak lags the prey peak. ` +
    `The orbit encircles the fixed point at (prey ${preyEq.toFixed(1)}, predator ${predEq.toFixed(1)}) = (c/d, a/b). ` +
    `Raising predation b (now ${b}) or predator death c (now ${c}) shifts and reshapes that orbit — a higher death rate c pushes the prey equilibrium up and tends to lengthen the boom-and-bust period, while stronger coupling widens the amplitude of each swing.`;

  const code = `import numpy as np
from scipy.integrate import odeint
a, b, c, d = ${a}, ${b}, ${c}, ${d}
def lv(state, t):
    x, y = state
    return [a*x - b*x*y, -c*y + d*x*y]
t = np.linspace(0, 40, 4000)
sol = odeint(lv, [10.0, 5.0], t)
print("prey equilibrium", c/d, "predator equilibrium", a/b)`;

  return (
    <StudioChrome title="Lotka-Volterra Predator-Prey" tagline="coupled population cycles"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Prey growth a" value={a} min={0.2} max={2} step={0.05} onChange={(v) => update({ a: v })} />
        <Slider label="Predation rate b" value={b} min={0.02} max={0.3} step={0.01} onChange={(v) => update({ b: v })} />
        <Slider label="Predator death c" value={c} min={0.2} max={3} step={0.05} onChange={(v) => update({ c: v })} />
        <Slider label="Predator growth d" value={d} min={0.02} max={0.2} step={0.005} onChange={(v) => update({ d: v })} />
        <p className="mt-3 text-xs text-slate-500">Two coupled equations produce the classic boom-and-bust cycle: prey multiply, predators feast and multiply, prey crash, predators starve, and the cycle repeats. The phase portrait shows the closed orbit — populations forever chasing each other, never settling.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Prey equilibrium" value={preyEq.toFixed(1)} /><Stat label="Predator equilibrium" value={predEq.toFixed(1)} /><Stat label="Dynamics" value="limit cycle" /><Equation tex={`\\dfrac{dx}{dt}=${a}x-${b}xy,\\quad \\dfrac{dy}{dt}=${d}xy-${c}y`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
