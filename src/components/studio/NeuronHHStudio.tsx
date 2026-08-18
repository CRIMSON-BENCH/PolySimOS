"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { current: number }> = {
  "Silent": { current: 3 },
  "At threshold": { current: 6.5 },
  "Regular firing": { current: 15 },
  "Fast train": { current: 35 },
};

// Hodgkin-Huxley neuron model.
export function NeuronHHStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ current }, update] = useShareableNumbers({ current: 10 }); // uA/cm^2
  const currentRef = useRef(current); currentRef.current = current;
  const [rate, setRate] = useState(0);
  const sim = useRef({ V: -65, m: 0.05, h: 0.6, n: 0.32, spikes: 0, lastV: -65, tSim: 0 });
  const trace = useRef<number[]>([]);

  // Changing the injected current restarts the neuron from rest (matches prior behavior).
  const resetSim = () => { sim.current = { V: -65, m: 0.05, h: 0.6, n: 0.32, spikes: 0, lastV: -65, tSim: 0 }; trace.current = []; setRate(0); };
  useEffect(() => { resetSim(); /* eslint-disable-next-line */ }, [current]);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gNa = 120, gK = 36, gL = 0.3, ENa = 50, EK = -77, EL = -54.387, Cm = 1;
    const aN = (x: number) => 0.01 * (x + 55) / (1 - Math.exp(-(x + 55) / 10));
    const bN = (x: number) => 0.125 * Math.exp(-(x + 65) / 80);
    const aM = (x: number) => 0.1 * (x + 40) / (1 - Math.exp(-(x + 40) / 10));
    const bM = (x: number) => 4 * Math.exp(-(x + 65) / 18);
    const aH = (x: number) => 0.07 * Math.exp(-(x + 65) / 20);
    const bH = (x: number) => 1 / (1 + Math.exp(-(x + 35) / 10));
    const S = sim.current; const tr = trace.current; const I = currentRef.current;
    const dt = 0.025;
    for (let f = 0; f < steps; f++) {
      for (let s = 0; s < 40; s++) {
        const INa = gNa * S.m * S.m * S.m * S.h * (S.V - ENa); const IK = gK * S.n * S.n * S.n * S.n * (S.V - EK); const IL = gL * (S.V - EL);
        const dV = (I - INa - IK - IL) / Cm;
        S.m += (aM(S.V) * (1 - S.m) - bM(S.V) * S.m) * dt; S.h += (aH(S.V) * (1 - S.h) - bH(S.V) * S.h) * dt; S.n += (aN(S.V) * (1 - S.n) - bN(S.V) * S.n) * dt;
        const nv = S.V + dV * dt; if (S.lastV < 0 && nv >= 0) S.spikes++; S.lastV = nv; S.V = nv; S.tSim += dt;
      }
      tr.push(S.V); if (tr.length > 500) tr.shift();
    }
    setRate(S.spikes / (S.tSim / 1000) || 0);
    const W = 540, H = 320; const ctx = hidpi(canvas, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 30, oy = H / 2, ph = H - 40;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy + 20); ctx.lineTo(W - 10, oy + 20); ctx.stroke();
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); tr.forEach((v, i) => { const x = ox + (i / 500) * (W - 40); const y = (H - 20) - ((v + 80) / 130) * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("membrane potential (mV)", ox + 4, 16); ctx.fillText("+40", 4, 40); ctx.fillText("-80", 6, H - 20);
  };

  const t = useTransport(frame);

  const explain =
    current < 6
      ? "Below threshold: the stimulus cannot overcome the leak and Na⁺ inactivation, so the membrane relaxes back to rest and never spikes."
      : "Above threshold: each stimulus recharges the membrane fast enough to re-trigger Na⁺ channels, so the neuron fires a repetitive train whose rate rises with the current.";

  const code = `import numpy as np
I = ${current}  # uA/cm^2
gNa, gK, gL = 120., 36., .3
ENa, EK, EL, Cm = 50., -77., -54.387, 1.
V, m, h, n = -65., .05, .6, .32
dt = .025
for _ in range(4000):
    aM = .1*(V+40)/(1-np.exp(-(V+40)/10)); bM = 4*np.exp(-(V+65)/18)
    aH = .07*np.exp(-(V+65)/20); bH = 1/(1+np.exp(-(V+35)/10))
    aN = .01*(V+55)/(1-np.exp(-(V+55)/10)); bN = .125*np.exp(-(V+65)/80)
    INa = gNa*m**3*h*(V-ENa); IK = gK*n**4*(V-EK); IL = gL*(V-EL)
    V += (I-INa-IK-IL)/Cm*dt
    m += (aM*(1-m)-bM*m)*dt; h += (aH*(1-h)-bH*h)*dt; n += (aN*(1-n)-bN*n)*dt
print("V", round(V, 1))`;

  return (
    <StudioChrome title="Hodgkin-Huxley Neuron" tagline="the action potential"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} speed={t.speed} onSpeed={t.setSpeed} />
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Injected current (µA/cm²)" value={current} min={0} max={40} step={0.5} onChange={(v) => update({ current: v })} />
        <p className="mt-3 text-xs text-slate-500">The Hodgkin-Huxley model — the Nobel-winning description of the nerve impulse — tracks voltage and the opening of sodium and potassium channels. Below a threshold current the neuron is silent; above it, it fires a train of action potentials whose rate climbs with the stimulus.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Firing rate" value={`${rate.toFixed(1)} Hz`} /><Stat label="Regime" value={current < 6 ? "subthreshold" : "spiking"} /><Stat label="Channels" value="Na⁺ / K⁺" /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
