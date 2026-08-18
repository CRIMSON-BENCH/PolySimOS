"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { hidpi } from "@/lib/studioKit";

// Free expansion of a gas: entropy increase, particles fill the box.
export function EntropyStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [released, setReleased] = useState(false);
  const [leftFrac, setLeftFrac] = useState(1);
  const releasedRef = useRef(released); releasedRef.current = released;
  const parts = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);

  const reset = () => { let s = 5; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    parts.current = Array.from({ length: 120 }, () => ({ x: 20 + r() * 220, y: 20 + r() * 260, vx: (r() - 0.5) * 4, vy: (r() - 0.5) * 4 })); setReleased(false); };
  useEffect(reset, []);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const wall = releasedRef.current ? 520 : 250;
    for (let s = 0; s < steps; s++) {
      for (const p of parts.current) { p.x += p.vx; p.y += p.vy; if (p.x < 12 || p.x > wall - 12) p.vx *= -1; if (p.y < 12 || p.y > 288) p.vy *= -1; p.x = Math.max(12, Math.min(wall - 12, p.x)); p.y = Math.max(12, Math.min(288, p.y)); }
    }
    let left = 0;
    for (const p of parts.current) if (p.x < 260) left++;
    setLeftFrac(left / parts.current.length);
    const ctx = hidpi(canvas, 540, 300); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 540, 300);
    ctx.strokeStyle = "#334155"; ctx.strokeRect(10, 10, 520, 280);
    if (!releasedRef.current) { ctx.strokeStyle = "#64748b"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(250, 10); ctx.lineTo(250, 290); ctx.stroke(); }
    for (const p of parts.current) { ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fillStyle = "#22d3ee"; ctx.fill(); }
  };

  const t = useTransport(frame);

  const dS = released ? 8.314 * Math.log(2) : 0; // per mole for doubling volume

  const explain = !released
    ? "All 120 particles are trapped in the left half — entropy is at its lowest. Remove the partition to watch it climb."
    : leftFrac > 0.6
    ? `Just released: ${(leftFrac * 100).toFixed(0)}% of the gas is still on the left, but collisions are already spreading it rightward and will not reverse.`
    : "The gas has spread evenly across both halves. Entropy rose by nR·ln2, and the reverse — every particle crowding back into one half — never spontaneously happens.";

  const code = `import numpy as np
R = 8.314  # J/mol/K
# free expansion: gas doubles its volume, no work, no heat
dS = R * np.log(2)
print("entropy change per mole:", dS, "J/K")`;

  return (
    <StudioChrome title="Entropy & Free Expansion" tagline="the second law in action"
      controls={<div>
        <button onClick={() => setReleased(true)} disabled={released} className="mb-2 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40">Remove partition</button>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { reset(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mt-3 text-xs text-slate-500">Gas confined to one half rushes to fill the whole box the instant the partition is removed — and never spontaneously crowds back. That irreversibility is the second law: entropy, a measure of disorder, always increases. For doubling the volume the entropy rises by nR·ln2, purely because there are vastly more ways to be spread out than packed in.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Fraction on left" value={`${(leftFrac * 100).toFixed(0)}%`} /><Stat label="ΔS (per mole)" value={`${dS.toFixed(2)} J/K`} /><Stat label="State" value={released ? "expanded" : "confined"} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
