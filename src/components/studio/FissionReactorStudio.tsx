"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Chain reaction: neutron multiplication factor k.
export function FissionReactorStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [k, setK] = useState(1.0);
  const [running, setRunning] = useState(true);
  const pop = useRef(4);
  const hist = useRef<number[]>([]);
  const [gen, setGen] = useState(0);

  const reset = () => { pop.current = 4; hist.current = []; setGen(0); };

  useEffect(() => {
    if (!running) return; let raf = 0; let frame = 0;
    const loop = () => {
      frame++;
      if (frame % 25 === 0) { pop.current = Math.max(0, pop.current * k * (0.9 + Math.random() * 0.2)); if (pop.current > 1e6) pop.current = 1e6; hist.current.push(pop.current); if (hist.current.length > 60) hist.current.shift(); setGen((g) => g + 1); }
      const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const maxP = Math.max(...hist.current, 10);
      ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
      ctx.strokeStyle = k > 1 ? "#f472b6" : k < 1 ? "#60a5fa" : "#a3e635"; ctx.lineWidth = 2; ctx.beginPath(); hist.current.forEach((p, i) => { const x = ox + (i / 60) * pw; const y = oy - (Math.log10(p + 1) / Math.log10(maxP + 1)) * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("neutron population (log) per generation", ox + 6, oy - ph + 12);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, k]);

  const state = k > 1.002 ? "supercritical (growing)" : k < 0.998 ? "subcritical (dying)" : "critical (steady)";
  return (
    <StudioChrome title="Fission Chain Reaction" tagline="the multiplication factor k"
      controls={<div>
        <Slider label="Multiplication factor k" value={k} min={0.8} max={1.2} step={0.005} onChange={setK} />
        <div className="mt-3 flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
        <p className="mt-3 text-xs text-slate-500">Each fission releases neutrons that can trigger more fissions. The multiplication factor k is how many of those neutrons cause a new fission on average. Below 1 the chain dies out; exactly 1 sustains steady power — a running reactor; above 1 it grows exponentially. Control rods nudge k around 1 to hold a reactor critical.</p>
      </div>}
      inspector={<div><Stat label="k factor" value={k.toFixed(3)} /><Stat label="Generation" value={String(gen)} /><Stat label="State" value={state} /></div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
