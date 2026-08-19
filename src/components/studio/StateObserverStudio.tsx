"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers, PALETTE } from "@/lib/studioKit";

const W = 560, H = 360;

// Mass-spring-damper plant (m = 1):  m x'' + c x' + k x = u
//   x1 = position, x2 = velocity
//   A = [[0, 1], [-k, -c]],  B = [[0], [1]],  C = [1, 0]  (only position measured)
const M = 1, K = 6, C_DAMP = 0.4; // lightly damped -> lively oscillation to track
const DT = 0.005, T = 12;         // seconds
const SAMPLE = 4;                  // plot every Nth step

const PRESETS: Record<string, { speed: number; noise: number; err0: number }> = {
  "Slow observer": { speed: 1.5, noise: 0, err0: 1.5 },
  "Fast observer": { speed: 9, noise: 0, err0: 1.5 },
  "Fast + noisy (tradeoff)": { speed: 9, noise: 0.08, err0: 1.5 },
  "Balanced": { speed: 4, noise: 0.02, err0: 1.5 },
};

// Standard normal via Box-Muller.
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function StateObserverStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ speed, noise, err0 }, update] = useShareableNumbers({ speed: 4, noise: 0.02, err0: 1.5 });
  const [tick, setTick] = useState(0);

  // Analytical pole placement for the 2x2 case. Place both observer poles at s = -p.
  // A - LC = [[-l1, 1], [-k-l2, -c]],  char poly: s^2 + (l1+c)s + (l1 c + k + l2).
  // Desired (double pole at -p): s^2 + 2p s + p^2  =>
  //   l1 = 2p - c,   l2 = p^2 - k - l1 c
  const p = speed;
  const l1 = 2 * p - C_DAMP;
  const l2 = p * p - K - l1 * C_DAMP;

  // Simulate true system + observer (from a WRONG initial estimate). Recomputed only when
  // params change; the animation just reveals progressively more of these arrays.
  const sim = useMemo(() => {
    const n = Math.floor(T / DT);
    let x1 = 1, x2 = 0;                 // true state
    let xh1 = 1 - err0, xh2 = 0;        // wrong initial estimate
    const t: number[] = [], p1: number[] = [], p2: number[] = [], e1: number[] = [], e2: number[] = [], en: number[] = [];
    for (let i = 0; i <= n; i++) {
      if (i % SAMPLE === 0) {
        t.push(i * DT);
        p1.push(x1); p2.push(x2); e1.push(xh1); e2.push(xh2);
        en.push(Math.hypot(x1 - xh1, x2 - xh2));
      }
      // free response (u = 0)
      const u = 0;
      // true plant
      const ax1 = x2;
      const ax2 = (u - C_DAMP * x2 - K * x1) / M;
      // measured output with noise (only y = position is available to the observer)
      const y = x1 + noise * randn();
      // observer: xh' = A xh + B u + L (y - C xh)
      const inn = y - xh1; // innovation
      const oh1 = xh2 + l1 * inn;
      const oh2 = (u - C_DAMP * xh2 - K * xh1) / M + l2 * inn;
      // forward Euler
      x1 += ax1 * DT; x2 += ax2 * DT;
      xh1 += oh1 * DT; xh2 += oh2 * DT;
    }
    // symmetric autoscale across everything plotted
    let m = 0.1;
    for (const arr of [p1, p2, e1, e2]) for (const v of arr) m = Math.max(m, Math.abs(v));
    return { t, p1, p2, e1, e2, en, ymax: m * 1.1, emax: Math.max(...en) * 1.1 || 1 };
  }, [speed, noise, err0, l1, l2]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = PALETTE.bg; ctx.fillRect(0, 0, W, H);
    const ox = 44, oy = H - 34, pw = W - 64, ph = H - 60;
    const N = sim.t.length;
    const n = Math.min(N, Math.max(2, tick));

    // grid + axes
    ctx.strokeStyle = PALETTE.grid; ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) { const gy = oy - (g / 4) * ph; ctx.beginPath(); ctx.moveTo(ox, gy); ctx.lineTo(ox + pw, gy); ctx.stroke(); }
    ctx.strokeStyle = PALETTE.axis; ctx.lineWidth = 1.2;
    const zeroY = oy - 0.5 * ph; // zero line (states are centred; ymax symmetric)
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, zeroY); ctx.lineTo(ox + pw, zeroY); ctx.stroke();

    const X = (i: number) => ox + (i / (N - 1)) * pw;
    const Yv = (v: number) => zeroY - (v / sim.ymax) * (ph / 2);
    const Ye = (v: number) => oy - (v / sim.emax) * ph;

    const line = (arr: number[], color: string, dashed: boolean, mapY: (v: number) => number) => {
      ctx.strokeStyle = color; ctx.lineWidth = dashed ? 1.6 : 2;
      ctx.setLineDash(dashed ? [5, 4] : []);
      ctx.beginPath();
      for (let i = 0; i < n; i++) { const xx = X(i), yy = mapY(arr[i]); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke(); ctx.setLineDash([]);
    };

    // true (solid) vs estimate (dashed) for both states
    line(sim.p1, PALETTE.series[0], false, Yv); // true position
    line(sim.e1, PALETTE.series[0], true, Yv);  // est position
    line(sim.p2, PALETTE.series[1], false, Yv); // true velocity
    line(sim.e2, PALETTE.series[1], true, Yv);  // est velocity
    // estimation error magnitude decaying (own scale)
    line(sim.en, PALETTE.series[2], false, Ye);

    // labels + legend
    ctx.fillStyle = PALETTE.text; ctx.font = "11px sans-serif";
    ctx.fillText("time →", ox + pw - 46, oy + 18);
    ctx.textAlign = "left";
    const leg: [string, string][] = [
      ["position  x₁ (— true, ┄ est)", PALETTE.series[0]],
      ["velocity  x₂ (— true, ┄ est)", PALETTE.series[1]],
      ["error  ‖x−x̂‖", PALETTE.series[2]],
    ];
    leg.forEach(([txt, col], i) => {
      const ly = oy - ph + 12 + i * 15;
      ctx.fillStyle = col; ctx.fillRect(ox + 6, ly - 8, 14, 3);
      ctx.fillStyle = PALETTE.text; ctx.fillText(txt, ox + 26, ly);
    });
  }, [sim, tick]);

  // restart the reveal animation whenever the simulation changes
  useEffect(() => {
    setTick(0);
    const total = sim.t.length;
    const id = setInterval(() => setTick((t) => (t < total ? t + 6 : t)), 32);
    return () => clearInterval(id);
  }, [sim]);

  const efold = 1 / p;
  const explain =
    p >= 8 && noise >= 0.04
      ? `Fast observer poles at s = −${p.toFixed(1)} pull the estimate onto the truth in about ${efold.toFixed(2)} s, but the large gains L = [${l1.toFixed(1)}, ${l2.toFixed(1)}] amplify the measurement noise — notice the dashed estimates jitter. This is the core observer tradeoff.`
      : p >= 8
      ? `Fast observer poles at s = −${p.toFixed(1)} give an error e-folding time near ${efold.toFixed(2)} s: the dashed estimate snaps onto the solid truth almost immediately. With no noise this is "free", but real sensors would make these high gains ring.`
      : p <= 2
      ? `Slow observer poles at s = −${p.toFixed(1)} mean the estimation error decays with an e-folding time of ${efold.toFixed(2)} s — the dashed estimate lags and only slowly closes the gap to the true state, but the low gains reject measurement noise well.`
      : `Observer poles at s = −${p.toFixed(1)} give a balanced error e-folding time of ${efold.toFixed(2)} s: the estimate converges within a few seconds while keeping the gains L = [${l1.toFixed(1)}, ${l2.toFixed(1)}] modest enough to tolerate noise.`;

  const code = `import numpy as np
from scipy.signal import place_poles

# Mass-spring-damper plant (m=1): x1=position, x2=velocity, only x1 measured
k, c = ${K}, ${C_DAMP}
A = np.array([[0.0, 1.0], [-k, -c]])
B = np.array([[0.0], [1.0]])
C = np.array([[1.0, 0.0]])

# Place BOTH observer poles at s = -p  (design on the dual pair (A^T, C^T))
p = ${p}
L = place_poles(A.T, C.T, [-p, -p - 1e-3]).gain_matrix.T   # (2,1)

dt, T = ${DT}, ${T}
noise, err0 = ${noise}, ${err0}
x  = np.array([1.0, 0.0])            # true state
xh = np.array([1.0 - err0, 0.0])     # WRONG initial estimate
for _ in range(int(T / dt)):
    u = 0.0
    y = C @ x + noise * np.random.randn()          # noisy measurement
    x  = x  + dt * (A @ x  + (B.flatten() * u))
    xh = xh + dt * (A @ xh + (B.flatten() * u) + (L.flatten() * (y - C @ xh)))
print("final estimation error", np.round(x - xh, 4))`;

  return (
    <StudioChrome title="State Observer" tagline="Luenberger observer · state estimation"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Observer speed (pole −p)" value={speed} min={0.5} max={12} step={0.5} onChange={(v) => update({ speed: v })} />
        <Slider label="Measurement noise σ" value={noise} min={0} max={0.15} step={0.005} onChange={(v) => update({ noise: v })} />
        <Slider label="Initial estimate error" value={err0} min={0} max={2} step={0.1} onChange={(v) => update({ err0: v })} />
        <p className="mt-3 text-xs text-slate-500">A Luenberger observer reconstructs the full state of a mass-spring-damper from the measured position alone. It starts from a wrong guess (solid = true, dashed = estimate) and the error e = x − x̂ decays as (A − LC). Push the observer speed up to converge faster — then add noise to see why you can&apos;t just crank it.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Observer poles" value={`−${p.toFixed(1)}, −${p.toFixed(1)}`} />
        <Stat label="Gain L" value={`[${l1.toFixed(2)}, ${l2.toFixed(2)}]`} />
        <Stat label="Error e-folding" value={`${efold.toFixed(2)} s`} />
        <Stat label="Convergence rate" value={`${p.toFixed(1)} /s`} />
        <Equation tex={`\\dot{\\hat x}=A\\hat x+Bu+L(y-C\\hat x)`} />
        <Equation tex={`\\dot e=(A-LC)e,\\quad \\lambda=-${p.toFixed(1)},\\,-${p.toFixed(1)}`} label="Error dynamics" />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto w-full max-w-full rounded-lg" /></StudioChrome>
  );
}
