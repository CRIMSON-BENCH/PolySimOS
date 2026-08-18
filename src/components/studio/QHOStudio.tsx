"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { n: number }> = {
  "Ground state": { n: 0 },
  "First excited": { n: 1 },
  "Mid ladder": { n: 3 },
  "High n (classical)": { n: 6 },
};

// Quantum harmonic oscillator: E_n = (n+1/2) hbar omega, Hermite wavefunctions.
function hermite(n: number, x: number): number { if (n === 0) return 1; if (n === 1) return 2 * x; let h0 = 1, h1 = 2 * x; for (let k = 2; k <= n; k++) { const h = 2 * x * h1 - 2 * (k - 1) * h0; h0 = h1; h1 = h; } return h1; }

export function QHOStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ n }, update] = useShareableNumbers({ n: 3 });
  const [showProb, setShowProb] = useState(false);

  useEffect(() => {
    const W = 540, H = 360; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, oy = H - 30, ph = H - 60; const N = Math.round(n);
    // potential parabola
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 1.5; ctx.beginPath(); for (let px = 0; px < W; px++) { const x = (px - cx) / 55; const v = 0.5 * x * x; const y = oy - (v / 8) * ph; px ? ctx.lineTo(px, y) : ctx.moveTo(px, y); } ctx.stroke();
    // levels
    for (let k = 0; k <= 6; k++) { const E = k + 0.5; const y = oy - (E / 8) * ph; ctx.strokeStyle = k === N ? "#a3e635" : "#1e293b"; ctx.lineWidth = k === N ? 2 : 1; const xr = Math.sqrt(2 * E) * 55; ctx.beginPath(); ctx.moveTo(cx - xr, y); ctx.lineTo(cx + xr, y); ctx.stroke(); }
    // wavefunction at level n
    const E = N + 0.5; const baseY = oy - (E / 8) * ph;
    let norm = 0; for (let px = 0; px < W; px++) { const x = (px - cx) / 55; const psi = hermite(N, x) * Math.exp(-x * x / 2); norm = Math.max(norm, Math.abs(psi)); }
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let px = 0; px < W; px++) { const x = (px - cx) / 55; let psi = hermite(N, x) * Math.exp(-x * x / 2) / norm; if (showProb) psi = psi * psi; const y = baseY - psi * 40; px ? ctx.lineTo(px, y) : ctx.moveTo(px, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(showProb ? "|ψ|² over the parabolic well" : "ψ over the parabolic well", 12, 18);
  }, [n, showProb]);

  const nLevel = Math.round(n);
  const explain =
    nLevel === 0
      ? "The ground state still has ½ħω of zero-point energy — the particle can never sit perfectly still, and |ψ|² peaks right at the center of the well."
      : nLevel >= 5
      ? `At n=${nLevel} the wavefunction has ${nLevel} nodes and its probability piles up near the classical turning points — the high-n limit where quantum behaviour starts to resemble a classical oscillator.`
      : `State n=${nLevel} sits at ${(nLevel + 0.5).toFixed(1)} ħω with ${nLevel} node${nLevel === 1 ? "" : "s"}; levels stay evenly spaced by exactly ħω all the way up the ladder.`;

  const code = `import numpy as np
from numpy.polynomial.hermite import hermval
n = ${nLevel}
E = n + 0.5   # energy in units of hbar*omega
x = np.linspace(-6, 6, 500)
c = [0]*n + [1]
psi = hermval(x, c) * np.exp(-x**2 / 2)
psi /= np.max(np.abs(psi))
print("energy", E, "hbar*omega ; nodes", n)`;

  return (
    <StudioChrome title="Quantum Harmonic Oscillator" tagline="evenly-spaced energy ladder"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Quantum number n" value={n} min={0} max={6} step={1} onChange={(v) => update({ n: v })} />
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" checked={showProb} onChange={(e) => setShowProb(e.target.checked)} /> Show probability density</label>
        <p className="mt-3 text-xs text-slate-500">The quantum harmonic oscillator — a particle in a parabolic well — has energy levels evenly spaced by ħω, starting at a nonzero zero-point energy of ½ħω. Its wavefunctions are Hermite polynomials times a Gaussian. It models molecular vibrations, phonons, and quantum fields, making it the most important solvable system in physics.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Energy" value={`${(nLevel + 0.5).toFixed(1)} ħω`} /><Stat label="Level n" value={String(nLevel)} /><Stat label="Zero-point" value="½ ħω" /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
