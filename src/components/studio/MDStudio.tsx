"use client";

import { useEffect, useRef, useState } from "react";
import { Atom, DEFAULT_MD, seedAtoms, stepMD, temperature, thermostat } from "@/lib/engines/md";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { n: number; targetT: number }> = {
  "Solid (cold)": { n: 120, targetT: 20 },
  "Melting point": { n: 120, targetT: 120 },
  "Hot gas": { n: 120, targetT: 350 },
  "Dense fluid": { n: 240, targetT: 100 },
};

export function MDStudio() {
  const box = DEFAULT_MD.box;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const atomsRef = useRef<Atom[]>([]);
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [{ n, targetT }, update] = useShareableNumbers({ n: 120, targetT: 120 });
  const [T, setT] = useState(0);

  useEffect(() => { atomsRef.current = seedAtoms({ ...DEFAULT_MD, n }); }, [n]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, box, box);
    let frame = 0;
    const loop = () => {
      const atoms = atomsRef.current; const p = { ...DEFAULT_MD, n };
      if (running) { for (let s = 0; s < 3; s++) stepMD(atoms, p); if (frame % 20 === 0) thermostat(atoms, targetT); }
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, box, box);
      for (const a of atoms) { const sp = Math.hypot(a.vx, a.vy); ctx.beginPath(); ctx.fillStyle = `hsl(${210 - Math.min(150, sp * 3)},90%,60%)`; ctx.arc(a.x, a.y, DEFAULT_MD.sigma * 0.4, 0, 7); ctx.fill(); }
      if (frame++ % 15 === 0) setT(temperature(atoms));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, n, targetT, box]);

  const explain =
    targetT < 60
      ? `At a target temperature of ${targetT}, thermal energy is too weak to break the Lennard-Jones bonds, so the ${n} atoms stay locked in an ordered lattice — a solid.`
      : targetT < 200
      ? `Near a target of ${targetT}, thermal energy rivals the Lennard-Jones well depth, so the ${n}-atom lattice loses its order and begins to flow — melting.`
      : `At a target temperature of ${targetT}, thermal motion overwhelms the Lennard-Jones attraction and the ${n} atoms fill the box freely — a gas.`;

  const code = `import numpy as np
# Lennard-Jones MD (velocity-Verlet, periodic box)
n, target_T = ${n}, ${targetT}
pos = np.random.rand(n, 2) * box; vel = np.random.randn(n, 2)
for step in range(2000):
    f = lj_forces(pos, box)              # -dU/dr for U = 4(r^-12 - r^-6)
    vel += 0.5 * f * dt; pos = (pos + vel * dt) % box
    vel += 0.5 * lj_forces(pos, box) * dt
    if step % 20 == 0:                   # Berendsen-style thermostat
        vel *= np.sqrt(target_T / (0.5 * (vel**2).sum() / n))
print("T", 0.5 * (vel**2).sum() / n)`;

  return (
    <StudioChrome
      title="Molecular Dynamics Studio"
      tagline="Lennard-Jones · velocity-Verlet · periodic box"
      controls={
        <div>
          <div className="mb-3 flex gap-2">
            <button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button>
            <button onClick={() => (atomsRef.current = seedAtoms({ ...DEFAULT_MD, n }))} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Reset</button>
          </div>
          <p className="mb-3 text-xs text-slate-500">Atoms interact via a Lennard-Jones potential. Raise the temperature to melt the lattice.</p>
          <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
          <Slider label="Atoms" value={n} min={40} max={240} step={10} onChange={(v) => update({ n: v })} />
          <Slider label="Target temperature" value={targetT} min={5} max={400} step={5} onChange={(v) => update({ targetT: v })} />
          <ShareBar code={code} />
        </div>
      }
      inspector={<div><Stat label="Atoms" value={String(n)} /><Stat label="Temperature" value={T.toFixed(1)} /><Stat label="Potential" value="Lennard-Jones" /><Stat label="Integrator" value="Velocity-Verlet" /><ExplainResult text={explain} /></div>}
    >
      <canvas ref={canvasRef} width={box} height={box} className="mx-auto h-auto max-h-[460px] w-auto max-w-full rounded-lg" />
    </StudioChrome>
  );
}
