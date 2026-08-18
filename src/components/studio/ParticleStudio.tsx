"use client";

import { useEffect, useRef, useState } from "react";
import {
  Particle,
  ParticleParams,
  DEFAULT_PARTICLE_PARAMS,
  seedParticles,
  seedOrbit,
  stepParticles,
  particleMetrics,
} from "@/lib/engines/particles";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 480;

const PRESETS: Record<string, { count: number; pairwiseG: number; gravityY: number; restitution: number }> = {
  "Cluster": { count: 120, pairwiseG: 200, gravityY: 0, restitution: 0.9 },
  "Gas cloud": { count: 200, pairwiseG: 0, gravityY: 0, restitution: 1 },
  "Rainfall": { count: 150, pairwiseG: 0, gravityY: 300, restitution: 0.3 },
  "Tight orbit": { count: 80, pairwiseG: 120, gravityY: 0, restitution: 0.95 },
};

export function ParticleStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const partsRef = useRef<Particle[]>([]);
  const paramsRef = useRef<ParticleParams>({ ...DEFAULT_PARTICLE_PARAMS, width: W, height: H });
  const lastRef = useRef(0);
  const frameCountRef = useRef(0);

  const [scene, setScene] = useState<"orbit" | "gas">("orbit");
  const [{ count, pairwiseG, gravityY, restitution }, update] = useShareableNumbers({
    count: 120,
    pairwiseG: 60,
    gravityY: 0,
    restitution: 0.9,
  });
  const [metrics, setMetrics] = useState({ kineticEnergy: 0, meanSpeed: 0, maxSpeed: 0 });

  // reset scene
  useEffect(() => {
    const p = paramsRef.current;
    p.gravityY = gravityY;
    p.pairwiseG = pairwiseG;
    p.restitution = restitution;
    partsRef.current = scene === "orbit" ? seedOrbit(count, p) : seedParticles(count, p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, count]);

  // live-update params without reseeding
  useEffect(() => {
    paramsRef.current.gravityY = gravityY;
    paramsRef.current.pairwiseG = pairwiseG;
    paramsRef.current.restitution = restitution;
  }, [gravityY, pairwiseG, restitution]);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = hidpi(canvas, W, H);
    const now = performance.now();
    const dt = lastRef.current ? Math.min(0.033, (now - lastRef.current) / 1000) : 0.016;
    lastRef.current = now;
    const parts = partsRef.current;
    // substep for stability; `steps` (speed) advances more sim time per frame
    const sub = 2;
    const total = sub * steps;
    for (let s = 0; s < total; s++) stepParticles(parts, paramsRef.current, dt / sub);
    // render
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, W, H);
    for (const pt of parts) {
      const speed = Math.hypot(pt.vx, pt.vy);
      const hue = 190 - Math.min(120, speed * 0.6);
      ctx.beginPath();
      ctx.fillStyle = pt.fixed ? "#a3e635" : `hsl(${hue}, 90%, 60%)`;
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    if (frameCountRef.current++ % 10 === 0) setMetrics(particleMetrics(parts));
  };

  const t = useTransport(frame);

  const reset = () => {
    const p = paramsRef.current;
    partsRef.current = scene === "orbit" ? seedOrbit(count, p) : seedParticles(count, p);
  };

  const explain =
    gravityY > 0
      ? `Downward gravity dominates: the ${count} bodies fall and settle, and at restitution ${restitution} each bounce ${restitution < 0.5 ? "loses most of" : "keeps most of"} its energy.`
      : pairwiseG >= 150
      ? `Strong pairwise gravity (G=${pairwiseG}) pulls the ${count} bodies into tight clumps — kinetic energy spikes as they collapse and slingshot past each other.`
      : pairwiseG === 0
      ? `With no mutual gravity the ${count} bodies act like an ideal gas, spreading out and colliding at roughly constant total energy.`
      : `Moderate mutual gravity (G=${pairwiseG}) lets the ${count} bodies form loose orbiting structures instead of collapsing outright.`;

  const code = `# 2D N-body: symplectic Euler + pairwise gravity, impulse collisions
import numpy as np
count, G, gy, e = ${count}, ${pairwiseG}, ${gravityY}, ${restitution}
pos = np.random.rand(count, 2) * np.array([${W}, ${H}])
vel = np.zeros((count, 2))
# each step: sum pairwise gravity G, add downward gy, integrate, bounce walls with restitution e
print(count, "bodies; G", G, "gy", gy, "restitution", e)`;

  return (
    <StudioChrome
      title="Particle / N-Body Studio"
      tagline="symplectic Euler · impulse collisions"
      controls={
        <div>
          <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { reset(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
          <div className="mb-3 flex gap-2">
            {(["orbit", "gas"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScene(s)}
                className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold capitalize ${
                  scene === s
                    ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                    : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"
                }`}
              >
                {s === "orbit" ? "Orbital" : "Gas"}
              </button>
            ))}
          </div>
          <Presets
            presets={Object.keys(PRESETS).map((label) => ({ label }))}
            onApply={(label) => update(PRESETS[label])}
          />
          <Slider label="Particles" value={count} min={20} max={400} step={10} onChange={(v) => update({ count: v })} />
          <Slider label="Pairwise gravity G" value={pairwiseG} min={0} max={200} step={5} onChange={(v) => update({ pairwiseG: v })} />
          <Slider label="Downward gravity" value={gravityY} min={0} max={400} step={10} onChange={(v) => update({ gravityY: v })} />
          <Slider label="Restitution" value={restitution} min={0} max={1} step={0.05} onChange={(v) => update({ restitution: v })} />
          <ShareBar code={code} />
        </div>
      }
      inspector={
        <div>
          <Stat label="Bodies" value={String(partsRef.current.length)} />
          <Stat label="Kinetic energy" value={metrics.kineticEnergy.toExponential(2)} />
          <Stat label="Mean speed" value={metrics.meanSpeed.toFixed(1)} />
          <Stat label="Max speed" value={metrics.maxSpeed.toFixed(1)} />
          <Equation tex={`F = \\frac{G\\,m_1 m_2}{r^2}, \\quad G = ${pairwiseG}, \\; N = ${count}`} />
          <ExplainResult text={explain} />
        </div>
      }
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
