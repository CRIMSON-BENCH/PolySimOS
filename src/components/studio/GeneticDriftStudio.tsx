"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Wright-Fisher genetic drift: multiple replicate populations.
export function GeneticDriftStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [popSize, setPopSize] = useState(50);
  const [p0, setP0] = useState(0.5);
  const [reps, setReps] = useState(15);
  const [seed, setSeed] = useState(1);
  const [fixed, setFixed] = useState(0);
  const [lost, setLost] = useState(0);

  useEffect(() => {
    const W = 540, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const N = Math.round(popSize); const gens = 120; const ox = 40, oy = H - 30, pw = W - 60, ph = H - 50;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#475569"; ctx.setLineDash([3, 4]); [0, 0.5, 1].forEach((f) => { const y = oy - f * ph; ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + pw, y); ctx.stroke(); }); ctx.setLineDash([]);
    let s = seed * 26881 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const hue = ["#22d3ee", "#f472b6", "#a3e635", "#fbbf24", "#c084fc", "#fb7185", "#34d399", "#60a5fa"];
    let nFixed = 0, nLost = 0;
    for (let rep = 0; rep < Math.round(reps); rep++) {
      let p = p0; ctx.strokeStyle = hue[rep % hue.length] + "cc"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ox, oy - p * ph);
      for (let g = 1; g <= gens; g++) { let count = 0; for (let i = 0; i < N; i++) if (rnd() < p) count++; p = count / N; const x = ox + (g / gens) * pw; ctx.lineTo(x, oy - p * ph); if (p === 0 || p === 1) break; }
      ctx.stroke(); if (p >= 1) nFixed++; else if (p <= 0) nLost++;
    }
    setFixed(nFixed); setLost(nLost);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("allele frequency (replicate populations)", ox + 6, oy - ph + 14); ctx.fillText("generations →", ox + pw - 80, oy + 18);
    ctx.fillText("fixed (1.0)", ox + 4, oy - ph + 2); ctx.fillText("lost (0.0)", ox + 4, oy - 4);
  }, [popSize, p0, reps, seed]);

  return (
    <StudioChrome title="Genetic Drift (Wright-Fisher)" tagline="chance changes allele frequencies"
      controls={<div>
        <Slider label="Population size N" value={popSize} min={5} max={500} step={5} onChange={setPopSize} />
        <Slider label="Initial frequency p₀" value={p0} min={0.05} max={0.95} step={0.05} onChange={setP0} />
        <Slider label="Replicate populations" value={reps} min={3} max={24} step={1} onChange={setReps} />
        <button onClick={() => setSeed((n) => n + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">Resample</button>
        <p className="mt-3 text-xs text-slate-500">Even with no selection, allele frequencies wander purely by chance as each generation is randomly sampled from the last. In small populations this genetic drift is fast and alleles quickly fix or vanish; in large populations it is slow. Each colored line is an independent population starting from the same frequency.</p>
      </div>}
      inspector={<div><Stat label="Fixed (reached 1)" value={String(fixed)} /><Stat label="Lost (reached 0)" value={String(lost)} /><Stat label="Population size" value={String(Math.round(popSize))} /></div>}
    ><canvas ref={canvasRef} width={540} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
