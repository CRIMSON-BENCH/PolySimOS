"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// 1D infinite square well: E_n = n^2 h^2 / (8 m L^2).
export function ParticleBoxStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [n, setN] = useState(3);
  const [L, setL] = useState(1); // nm
  const [showProb, setShowProb] = useState(true);

  const En = (nn: number) => nn * nn * 0.376 / (L * L); // eV, h^2/8m in eV·nm^2 units
  const energy = En(Math.round(n));

  useEffect(() => {
    const W = 540, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, ow = W - 80, oy = H - 40, oh = H - 70; const N = Math.round(n);
    // well walls
    ctx.strokeStyle = "#475569"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox, oy - oh); ctx.lineTo(ox, oy); ctx.lineTo(ox + ow, oy); ctx.lineTo(ox + ow, oy - oh); ctx.stroke();
    // energy levels
    const eMax = En(6);
    for (let k = 1; k <= 6; k++) { const y = oy - (En(k) / eMax) * oh; ctx.strokeStyle = k === N ? "#a3e635" : "#1e293b"; ctx.lineWidth = k === N ? 2 : 1; ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + ow, y); ctx.stroke(); }
    // wavefunction / probability for level n
    const baseY = oy - (energy / eMax) * oh;
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= ow; i++) { const x = i / ow; const psi = Math.sin(N * Math.PI * x); const v = showProb ? psi * psi : psi; const y = baseY - v * 42; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(showProb ? "|ψ|² probability density" : "ψ wavefunction", ox + 6, 18); ctx.fillText("E", ox - 24, oy - oh + 6);
  }, [n, L, showProb]);

  return (
    <StudioChrome title="Particle in a Box" tagline="quantized energy levels"
      controls={<div>
        <Slider label="Quantum number n" value={n} min={1} max={6} step={1} onChange={setN} />
        <Slider label="Well width L (nm)" value={L} min={0.2} max={3} step={0.1} onChange={setL} />
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" checked={showProb} onChange={(e) => setShowProb(e.target.checked)} /> Show probability density</label>
        <p className="mt-3 text-xs text-slate-500">Confine a quantum particle to a box and its energy can only take discrete values, E_n = n²h²/8mL². The wavefunctions are standing waves with n humps; squaring them gives the probability of finding the particle at each point. Narrowing the box pushes the energy levels dramatically higher — quantum confinement.</p>
      </div>}
      inspector={<div><Stat label="Energy Eₙ" value={`${energy.toFixed(3)} eV`} /><Stat label="Level n" value={String(Math.round(n))} /><Stat label="Nodes" value={String(Math.round(n) - 1)} /></div>}
    ><canvas ref={canvasRef} width={540} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
