"use client";

import { useEffect, useMemo, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 480;

const PRESETS: Record<string, { R: number; L: number; C: number }> = {
  "Underdamped (rings)": { R: 1, L: 1, C: 1 },
  "Critically damped": { R: 2, L: 1, C: 1 },
  "Overdamped (sluggish)": { R: 6, L: 1, C: 1 },
  "Resonance": { R: 0.2, L: 4, C: 4 },
};

export function RLCStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ R, L, C }, update] = useShareableNumbers({ R: 1.5, L: 1, C: 1 });

  const data = useMemo(() => {
    // series RLC step response: L q'' + R q' + q/C = V0
    let q = 0, i = 0; const dt = 0.01, V0 = 1; const pts: { t: number; q: number; i: number }[] = [];
    for (let k = 0; k < 4000; k++) {
      const di = (V0 - R * i - q / C) / L; i += di * dt; q += i * dt; pts.push({ t: k * dt, q, i });
    }
    return pts;
  }, [R, L, C]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const pad = 34, T = data[data.length - 1].t;
    const qs = data.map((d) => d.q), is = data.map((d) => d.i);
    const lo = Math.min(0, ...qs, ...is), hi = Math.max(...qs, ...is, 0.1);
    const sx = (t: number) => pad + (t / T) * (W - 2 * pad); const sy = (v: number) => H - pad - ((v - lo) / (hi - lo)) * (H - 2 * pad);
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(pad, sy(0)); ctx.lineTo(W - pad, sy(0)); ctx.stroke();
    const draw = (key: "q" | "i", color: string) => { ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); data.forEach((d, k) => k ? ctx.lineTo(sx(d.t), sy(d[key])) : ctx.moveTo(sx(d.t), sy(d[key]))); ctx.stroke(); };
    draw("q", "#22d3ee"); draw("i", "#a3e635");
    ctx.font = "12px system-ui"; ctx.fillStyle = "#22d3ee"; ctx.fillText("charge q(t)", pad, 22); ctx.fillStyle = "#a3e635"; ctx.fillText("current i(t)", pad + 110, 22);
    const zeta = R / 2 * Math.sqrt(C / L);
    ctx.fillStyle = "#94a3b8"; ctx.fillText(zeta < 1 ? "underdamped (oscillatory)" : zeta > 1 ? "overdamped" : "critically damped", W - 240, H - 14);
  }, [data]);

  const zeta = (R / 2) * Math.sqrt(C / L);
  const w0 = 1 / Math.sqrt(L * C);

  const explain =
    zeta < 0.98
      ? `ζ = ${zeta.toFixed(3)} < 1: underdamped. With ω₀ = ${w0.toFixed(3)} rad/s the charge overshoots and rings, oscillating while it decays toward its steady value. Lower ζ means more ringing.`
      : zeta > 1.02
      ? `ζ = ${zeta.toFixed(3)} > 1: overdamped. With ω₀ = ${w0.toFixed(3)} rad/s there is no oscillation — the charge crawls to steady state sluggishly, and larger ζ makes it slower.`
      : `ζ = ${zeta.toFixed(3)} ≈ 1: critically damped. With ω₀ = ${w0.toFixed(3)} rad/s this is the fastest approach to steady state with no overshoot or oscillation.`;

  const code = `import numpy as np
from scipy.integrate import odeint

R, L, C, V0 = ${R}, ${L}, ${C}, 1.0

# series RLC: L q'' + R q' + q/C = V0, state = [q, i] with i = q'
def rlc(y, t):
    q, i = y
    di = (V0 - R * i - q / C) / L
    return [i, di]

t = np.arange(0, 40, 0.01)
sol = odeint(rlc, [0.0, 0.0], t)
q, i = sol[:, 0], sol[:, 1]

zeta = (R / 2) * np.sqrt(C / L)
w0 = 1 / np.sqrt(L * C)
print("zeta", zeta, "w0", w0)`;

  return (
    <StudioChrome title="RLC Circuit Studio" tagline="series RLC step response"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Apply a step voltage to a series RLC circuit and watch charge and current respond — under-, over-, or critically damped.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Resistance R" value={R} min={0} max={6} step={0.1} onChange={(v) => update({ R: v })} />
        <Slider label="Inductance L" value={L} min={0.2} max={4} step={0.1} onChange={(v) => update({ L: v })} />
        <Slider label="Capacitance C" value={C} min={0.2} max={4} step={0.1} onChange={(v) => update({ C: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Damping ζ" value={zeta.toFixed(3)} />
        <Stat label="Regime" value={zeta < 1 ? "underdamped" : zeta > 1 ? "overdamped" : "critical"} />
        <Stat label="ω₀" value={w0.toFixed(3)} />
        <ExplainResult text={explain} />
      </div>}
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
