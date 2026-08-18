"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { reactivity: number }> = {
  "Subcritical": { reactivity: -0.003 },
  "Delayed critical": { reactivity: 0.002 },
  "Near prompt": { reactivity: 0.006 },
  "Prompt-critical": { reactivity: 0.008 },
};

// Point reactor kinetics with one delayed-neutron group.
export function ReactorKineticsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ reactivity }, update] = useShareableNumbers({ reactivity: 0.001 }); // dollars-ish (as fraction)
  const [running, setRunning] = useState(true);
  const state = useRef({ n: 1, c: 1, t: 0 });
  const hist = useRef<number[]>([]);

  const beta = 0.0065, Lambda = 1e-4, lam = 0.08; // delayed fraction, prompt lifetime, decay const
  const reset = () => { state.current = { n: 1, c: beta / (Lambda * lam), t: 0 }; hist.current = []; };
  useEffect(reset, []);

  useEffect(() => {
    if (!running) return; let raf = 0; const rho = reactivity;
    const loop = () => {
      const s = state.current; const dt = 0.002; const c0 = beta / (Lambda * lam);
      for (let k = 0; k < 30; k++) { const dn = ((rho - beta) / Lambda) * s.n + lam * s.c; const dc = (beta / Lambda) * s.n - lam * s.c; s.n += dn * dt; s.c += dc * dt; s.t += dt; if (s.n > 1e6) s.n = 1e6; if (s.n < 1e-6) s.n = 1e-6; }
      hist.current.push(s.n); if (hist.current.length > 300) hist.current.shift(); void c0;
      const W = 520, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const maxP = Math.max(...hist.current, 2), minP = Math.min(...hist.current, 0.5);
      ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); hist.current.forEach((p, i) => { const x = ox + (i / 300) * pw; const y = oy - (Math.log10(p / minP) / Math.log10(maxP / minP + 0.01)) * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("reactor power (log) vs time", ox + 6, oy - ph + 12);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, reactivity]);

  const prompt = reactivity >= beta; const period = reactivity !== 0 ? Lambda / reactivity : Infinity;

  const explain =
    reactivity >= beta
      ? "Reactivity exceeds the delayed fraction β — the reactor is prompt-critical and power races up on the neutron lifetime (milliseconds), effectively uncontrollable."
      : reactivity > 0
      ? "Positive but below β — delayed neutrons stretch the response onto a stable, controllable reactor period."
      : reactivity === 0
      ? "Exactly critical — power holds steady as neutron production balances loss."
      : "Negative reactivity — the reactor is subcritical and power decays away over time.";

  const code = `import numpy as np
rho, beta, Lambda, lam = ${reactivity}, 0.0065, 1e-4, 0.08
n, c, dt = 1.0, beta/(Lambda*lam), 0.002
for _ in range(3000):
    dn = ((rho-beta)/Lambda)*n + lam*c
    dc = (beta/Lambda)*n - lam*c
    n += dn*dt; c += dc*dt
print("power", n)`;

  return (
    <StudioChrome title="Reactor Point Kinetics" tagline="power, reactivity & period"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Reactivity ρ" value={reactivity} min={-0.005} max={0.008} step={0.0002} onChange={(v) => update({ reactivity: v })} />
        <div className="mt-3 flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
        <p className="mt-3 text-xs text-slate-500">A small step in reactivity does not blow the power up instantly, because a fraction of neutrons are released with a delay. Those delayed neutrons slow the response to a controllable timescale — the reactor period. But push reactivity past the delayed fraction β and it goes prompt-critical, growing on the neutron lifetime — millisecond-fast and uncontrollable.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Reactivity" value={`${(reactivity / beta).toFixed(2)} $`} /><Stat label="Regime" value={prompt ? "PROMPT-CRITICAL" : reactivity > 0 ? "delayed (controllable)" : "subcritical"} /><Stat label="Power" value={state.current.n.toExponential(2)} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
