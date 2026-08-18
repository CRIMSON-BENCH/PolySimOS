"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Free expansion of a gas: entropy increase, particles fill the box.
export function EntropyStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(true);
  const [released, setReleased] = useState(false);
  const [leftFrac, setLeftFrac] = useState(1);
  const parts = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);

  const reset = () => { let s = 5; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    parts.current = Array.from({ length: 120 }, () => ({ x: 20 + r() * 220, y: 20 + r() * 260, vx: (r() - 0.5) * 4, vy: (r() - 0.5) * 4 })); setReleased(false); };
  useEffect(reset, []);

  useEffect(() => {
    if (!running) return; let raf = 0;
    const loop = () => {
      const wall = released ? 520 : 250; let left = 0;
      for (const p of parts.current) { p.x += p.vx; p.y += p.vy; if (p.x < 12 || p.x > wall - 12) p.vx *= -1; if (p.y < 12 || p.y > 288) p.vy *= -1; p.x = Math.max(12, Math.min(wall - 12, p.x)); p.y = Math.max(12, Math.min(288, p.y)); if (p.x < 260) left++; }
      setLeftFrac(left / parts.current.length);
      const ctx = hidpi(canvasRef.current!, 540, 300); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 540, 300);
      ctx.strokeStyle = "#334155"; ctx.strokeRect(10, 10, 520, 280);
      if (!released) { ctx.strokeStyle = "#64748b"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(250, 10); ctx.lineTo(250, 290); ctx.stroke(); }
      for (const p of parts.current) { ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fillStyle = "#22d3ee"; ctx.fill(); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, released]);

  const dS = released ? 8.314 * Math.log(2) : 0; // per mole for doubling volume
  return (
    <StudioChrome title="Entropy & Free Expansion" tagline="the second law in action"
      controls={<div>
        <button onClick={() => setReleased(true)} disabled={released} className="w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40">Remove partition</button>
        <div className="mt-2 flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">{running ? "Pause" : "Run"}</button><button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
        <p className="mt-3 text-xs text-slate-500">Gas confined to one half rushes to fill the whole box the instant the partition is removed — and never spontaneously crowds back. That irreversibility is the second law: entropy, a measure of disorder, always increases. For doubling the volume the entropy rises by nR·ln2, purely because there are vastly more ways to be spread out than packed in.</p>
      </div>}
      inspector={<div><Stat label="Fraction on left" value={`${(leftFrac * 100).toFixed(0)}%`} /><Stat label="ΔS (per mole)" value={`${dS.toFixed(2)} J/K`} /><Stat label="State" value={released ? "expanded" : "confined"} /></div>}
    ><canvas ref={canvasRef} width={540} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
