"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Hodgkin-Huxley neuron model.
export function NeuronHHStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [current, setCurrent] = useState(10); // uA/cm^2
  const [running, setRunning] = useState(true);
  const [rate, setRate] = useState(0);

  useEffect(() => {
    if (!running) return; let raf = 0;
    const gNa = 120, gK = 36, gL = 0.3, ENa = 50, EK = -77, EL = -54.387, Cm = 1;
    let V = -65, m = 0.05, h = 0.6, n = 0.32; const trace: number[] = []; let spikes = 0; let lastV = V; let tSim = 0;
    const aN = (x: number) => 0.01 * (x + 55) / (1 - Math.exp(-(x + 55) / 10));
    const bN = (x: number) => 0.125 * Math.exp(-(x + 65) / 80);
    const aM = (x: number) => 0.1 * (x + 40) / (1 - Math.exp(-(x + 40) / 10));
    const bM = (x: number) => 4 * Math.exp(-(x + 65) / 18);
    const aH = (x: number) => 0.07 * Math.exp(-(x + 65) / 20);
    const bH = (x: number) => 1 / (1 + Math.exp(-(x + 35) / 10));
    const loop = () => {
      const dt = 0.025;
      for (let s = 0; s < 40; s++) {
        const INa = gNa * m * m * m * h * (V - ENa); const IK = gK * n * n * n * n * (V - EK); const IL = gL * (V - EL);
        const dV = (current - INa - IK - IL) / Cm;
        m += (aM(V) * (1 - m) - bM(V) * m) * dt; h += (aH(V) * (1 - h) - bH(V) * h) * dt; n += (aN(V) * (1 - n) - bN(V) * n) * dt;
        const nv = V + dV * dt; if (lastV < 0 && nv >= 0) spikes++; lastV = nv; V = nv; tSim += dt;
      }
      trace.push(V); if (trace.length > 500) trace.shift();
      setRate(spikes / (tSim / 1000) || 0);
      const ctx = canvasRef.current!.getContext("2d")!; const W = 540, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const ox = 30, oy = H / 2, ph = H - 40;
      ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy + 20); ctx.lineTo(W - 10, oy + 20); ctx.stroke();
      ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); trace.forEach((v, i) => { const x = ox + (i / 500) * (W - 40); const y = (H - 20) - ((v + 80) / 130) * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("membrane potential (mV)", ox + 4, 16); ctx.fillText("+40", 4, 40); ctx.fillText("-80", 6, H - 20);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, current]);

  return (
    <StudioChrome title="Hodgkin-Huxley Neuron" tagline="the action potential"
      controls={<div>
        <Slider label="Injected current (µA/cm²)" value={current} min={0} max={40} step={0.5} onChange={setCurrent} />
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">The Hodgkin-Huxley model — the Nobel-winning description of the nerve impulse — tracks voltage and the opening of sodium and potassium channels. Below a threshold current the neuron is silent; above it, it fires a train of action potentials whose rate climbs with the stimulus.</p>
      </div>}
      inspector={<div><Stat label="Firing rate" value={`${rate.toFixed(1)} Hz`} /><Stat label="Regime" value={current < 6 ? "subthreshold" : "spiking"} /><Stat label="Channels" value="Na⁺ / K⁺" /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
