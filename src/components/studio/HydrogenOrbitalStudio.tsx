"use client";

import { useEffect, useMemo, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const ORBITALS: Record<string, { n: number; label: string; psi: (r: number, ct: number) => number }> = {
  "1s": { n: 1, label: "1s", psi: (r) => Math.exp(-r) },
  "2s": { n: 2, label: "2s", psi: (r) => (2 - r) * Math.exp(-r / 2) },
  "2p": { n: 2, label: "2p_z", psi: (r, ct) => r * ct * Math.exp(-r / 2) },
  "3p": { n: 3, label: "3p_z", psi: (r, ct) => (6 - r) * r * ct * Math.exp(-r / 3) },
  "3d": { n: 3, label: "3d_z²", psi: (r, ct) => (3 * ct * ct - 1) * r * r * Math.exp(-r / 3) },
};

// Map a quantum-number triple to the closest available cross-section render key.
const SHELL = ["s", "p", "d", "f"];
function keyFor(n: number, l: number): string {
  const shell = SHELL[l] ?? "s";
  if (ORBITALS[`${n}${shell}`]) return `${n}${shell}`;
  const same = Object.keys(ORBITALS).filter((k) => k.endsWith(shell));
  if (same.length) return same[same.length - 1];
  return "1s";
}

// Presets: each respects l < n and |m| <= l.
const PRESETS: Record<string, { n: number; l: number; m: number }> = {
  "1s (ground)": { n: 1, l: 0, m: 0 },
  "2p": { n: 2, l: 1, m: 0 },
  "3p": { n: 3, l: 1, m: 0 },
  "3d": { n: 3, l: 2, m: 0 },
};

export function HydrogenOrbitalStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ n, l, m }, update] = useShareableNumbers({ n: 2, l: 1, m: 0 });

  // Enforce physical validity regardless of slider combination.
  const L = Math.min(l, n - 1);
  const M = Math.max(-L, Math.min(L, m));
  const orb = useMemo(() => keyFor(n, L), [n, L]);

  useEffect(() => {
    const o = ORBITALS[orb]; const W = 400, H = 400; const ctx = hidpi(canvasRef.current!, W, H);
    const img = ctx.createImageData(W, H); const cx = W / 2, cy = H / 2; const scale = 7 * o.n;
    let maxV = 0; for (let py = 0; py < H; py += 2) for (let px = 0; px < W; px += 2) { const x = (px - cx) / scale, z = (py - cy) / scale; const r = Math.hypot(x, z); const ct = r > 0 ? z / r : 0; const v = o.psi(r, ct) ** 2; if (v > maxV) maxV = v; }
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) { const x = (px - cx) / scale, z = (py - cy) / scale; const r = Math.hypot(x, z); const ct = r > 0 ? z / r : 0; const v = Math.min(1, (o.psi(r, ct) ** 2) / maxV * 3); const idx = (py * W + px) * 4;
      img.data[idx] = 20 + v * 80; img.data[idx + 1] = 20 + v * 200; img.data[idx + 2] = 40 + v * 220; img.data[idx + 3] = 255; }
    ctx.putImageData(img, 0, 0);
    ctx.fillStyle = "#e2e8f0"; ctx.font = "13px sans-serif"; ctx.fillText(`hydrogen ${o.label} — |ψ|² (cross-section)`, 12, H - 14);
  }, [orb]);

  const radialNodes = n - L - 1;
  const shape = L === 0 ? "spherical (s)" : L === 1 ? "two lobes (p)" : L === 2 ? "cloverleaf (d)" : "multi-lobed (f)";
  const explain =
    `n=${n} sets the shell and energy (E = ${(-13.6 / (n * n)).toFixed(2)} eV) and the overall size of the cloud. ` +
    `l=${L} sets the shape: ${shape}. m=${M} sets the orientation in space. ` +
    `This orbital has ${radialNodes} radial node${radialNodes === 1 ? "" : "s"} and ${L} angular node${L === 1 ? "" : "s"}.`;

  const code = `import numpy as np
from scipy.special import genlaguerre, sph_harm, factorial

n, l, m = ${n}, ${L}, ${M}      # principal, azimuthal, magnetic
a0 = 1.0

def R(r):
    rho = 2 * r / (n * a0)
    norm = np.sqrt((2 / (n * a0))**3 * factorial(n - l - 1) / (2 * n * factorial(n + l)))
    return norm * np.exp(-rho / 2) * rho**l * genlaguerre(n - l - 1, 2 * l + 1)(rho)

r = np.linspace(1e-6, 25, 400)
theta = np.linspace(0, np.pi, 400)
Rg, Tg = np.meshgrid(r, theta)
Y = sph_harm(m, l, 0.0, Tg)               # phi = 0 cross-section
density = np.abs(R(Rg))**2 * np.abs(Y)**2  # |psi|^2 probability density
print("grid", density.shape, "peak |psi|^2", density.max())`;

  return (
    <StudioChrome title="Hydrogen Orbitals" tagline="electron probability clouds"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Solving the Schrödinger equation for hydrogen gives the orbitals — the probability clouds where an electron is likely to be found. The quantum numbers n, l, and m set the size, shape, and orientation. Brighter regions are higher probability density.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Principal n" value={n} min={1} max={3} step={1} onChange={(v) => update({ n: v })} />
        <Slider label="Azimuthal l" value={l} min={0} max={2} step={1} onChange={(v) => update({ l: v })} />
        <Slider label="Magnetic m" value={m} min={-2} max={2} step={1} onChange={(v) => update({ m: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Orbital" value={ORBITALS[orb].label} />
        <Stat label="Quantum numbers" value={`n=${n}, l=${L}, m=${M}`} />
        <Stat label="Energy" value={`${(-13.6 / (n * n)).toFixed(2)} eV`} />
        <Stat label="Nodes" value={`${radialNodes} radial, ${L} angular`} />
        <Equation tex={`E_{${n}} = -\\dfrac{13.6}{${n}^2}\\ \\text{eV} = ${(-13.6 / (n * n)).toFixed(2)}\\ \\text{eV}\\quad(${orb})`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={400} height={400} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
