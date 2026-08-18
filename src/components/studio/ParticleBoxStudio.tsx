"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { n: number; L: number }> = {
  "Ground state": { n: 1, L: 1 },
  "Excited n=3": { n: 3, L: 1 },
  "Wide well": { n: 2, L: 3 },
  "Tight box": { n: 2, L: 0.3 },
};

// 1D infinite square well: E_n = n^2 h^2 / (8 m L^2).
export function ParticleBoxStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ n, L }, update] = useShareableNumbers({ n: 3, L: 1 }); // L in nm
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

  const N = Math.round(n);
  const explain =
    N === 1
      ? `The ground state (n=1) has no interior nodes, so the particle is most likely found near the middle of the well.`
      : L <= 0.5
      ? `A narrow ${L} nm well forces the energy up to ${energy.toFixed(2)} eV — squeezing the box makes every level climb as 1/L², the hallmark of quantum confinement.`
      : `Level n=${N} carries ${N - 1} interior nodes, and because energy scales as n² it sits ${N * N}× above the ground state of this same well.`;

  const code = `# Particle in a 1D infinite square well
n, L = ${N}, ${L}  # L in nm
E = n**2 * 0.376 / L**2  # eV (h^2/8m in eV·nm^2)
print(f"E_{n} = {E:.3f} eV, nodes = {n - 1}")`;

  return (
    <StudioChrome title="Particle in a Box" tagline="quantized energy levels"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Quantum number n" value={n} min={1} max={6} step={1} onChange={(v) => update({ n: v })} />
        <Slider label="Well width L (nm)" value={L} min={0.2} max={3} step={0.1} onChange={(v) => update({ L: v })} />
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" checked={showProb} onChange={(e) => setShowProb(e.target.checked)} /> Show probability density</label>
        <p className="mt-3 text-xs text-slate-500">Confine a quantum particle to a box and its energy can only take discrete values, E_n = n²h²/8mL². The wavefunctions are standing waves with n humps; squaring them gives the probability of finding the particle at each point. Narrowing the box pushes the energy levels dramatically higher — quantum confinement.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Energy Eₙ" value={`${energy.toFixed(3)} eV`} /><Stat label="Level n" value={String(N)} /><Stat label="Nodes" value={String(N - 1)} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
