"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Hardy-Weinberg with selection: allele A freq p evolves under fitness.
export function HardyWeinbergStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [p0, setP0] = useState(0.5);
  const [wAA, setWAA] = useState(1.0);
  const [wAa, setWAa] = useState(1.0);
  const [waa, setWaa] = useState(0.8);
  const [pEnd, setPEnd] = useState(0.5);

  useEffect(() => {
    const W = 540, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    let p = p0; const gens = 100; const traj: number[] = [p];
    for (let g = 0; g < gens; g++) { const q = 1 - p; const wbar = p * p * wAA + 2 * p * q * wAa + q * q * waa; const pn = (p * p * wAA + p * q * wAa) / wbar; p = pn; traj.push(p); }
    setPEnd(p);
    const ox = 40, oy = H - 30, pw = 320, ph = H - 50;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); traj.forEach((v, i) => { const x = ox + (i / gens) * pw; const y = oy - v * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("allele A frequency p", ox + 6, oy - ph + 14); ctx.fillText("generations →", ox + pw - 80, oy + 18);
    // genotype bars at final
    const q = 1 - p; const geno = [["AA", p * p, "#22d3ee"], ["Aa", 2 * p * q, "#a3e635"], ["aa", q * q, "#f472b6"]] as const; const bx = 400;
    ctx.fillStyle = "#e2e8f0"; ctx.fillText("final genotypes", bx, 40);
    geno.forEach(([lbl, f, col], i) => { const y = 60 + i * 70; ctx.fillStyle = col; ctx.fillRect(bx, y, f * 110, 22); ctx.fillStyle = "#e2e8f0"; ctx.fillText(`${lbl}: ${(f * 100).toFixed(0)}%`, bx, y - 4); });
  }, [p0, wAA, wAa, waa]);

  return (
    <StudioChrome title="Hardy-Weinberg & Selection" tagline="population genetics"
      controls={<div>
        <Slider label="Initial freq of A (p₀)" value={p0} min={0.01} max={0.99} step={0.01} onChange={setP0} />
        <Slider label="Fitness AA" value={wAA} min={0} max={1} step={0.05} onChange={setWAA} />
        <Slider label="Fitness Aa" value={wAa} min={0} max={1} step={0.05} onChange={setWAa} />
        <Slider label="Fitness aa" value={waa} min={0} max={1} step={0.05} onChange={setWaa} />
        <p className="mt-3 text-xs text-slate-500">Without selection, allele frequencies stay put and genotypes settle at p², 2pq, q² — Hardy-Weinberg equilibrium. Give the genotypes different fitness and selection shifts the allele frequency each generation. Heterozygote advantage (high Aa fitness) can hold both alleles in a stable balance.</p>
      </div>}
      inspector={<div><Stat label="Final freq A" value={pEnd.toFixed(3)} /><Stat label="Outcome" value={pEnd > 0.98 ? "A fixed" : pEnd < 0.02 ? "A lost" : "polymorphic"} /><Stat label="Mean fitness" value={(p0 * p0 * wAA + 2 * p0 * (1 - p0) * wAa + (1 - p0) ** 2 * waa).toFixed(2)} /></div>}
    ><canvas ref={canvasRef} width={540} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
