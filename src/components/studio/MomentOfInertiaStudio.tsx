"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const SHAPES = [{ n: "Solid disk", c: 0.5 }, { n: "Hoop / ring", c: 1 }, { n: "Solid sphere", c: 0.4 }, { n: "Rod (center)", c: 1 / 12 }];

const PRESETS: Record<string, { mass: number; size: number; d: number }> = {
  "Compact & centered": { mass: 2, size: 0.1, d: 0 },
  "Large radius": { mass: 2, size: 0.6, d: 0 },
  "Big offset axis": { mass: 2, size: 0.2, d: 0.5 },
  "Heavy & wide": { mass: 8, size: 0.5, d: 0 },
};

export function MomentOfInertiaStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shape, setShape] = useState(0);
  const [{ mass, size, d }, update] = useShareableNumbers({ mass: 2, size: 0.3, d: 0 });

  const c = SHAPES[shape].c, Icm = c * mass * size * size, I = Icm + mass * d * d;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = size * 260, axoff = d * 260;
    ctx.strokeStyle = "#f472b6"; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(cx - axoff, 20); ctx.lineTo(cx - axoff, H - 20); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = 0.85;
    if (shape === 0) { ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); }
    else if (shape === 1) { ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = Math.max(6, R * 0.15); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); }
    else if (shape === 2) { const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 4, cx, cy, R); g.addColorStop(0, "#67e8f9"); g.addColorStop(1, "#0891b2"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.fillStyle = "#22d3ee"; ctx.fillRect(cx - R, cy - 9, R * 2, 18); }
    ctx.globalAlpha = 1; ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("pink = rotation axis (offset with slider)", 12, 20);
  }, [shape, size, d]);

  const explain =
    d === 0
      ? "The axis runs through the center of mass, so there is no parallel-axis penalty — this is the smallest moment of inertia this body can have."
      : `Shifting the axis ${d.toFixed(2)} m off-center adds md² = ${(mass * d * d).toFixed(3)} kg·m², about ${((mass * d * d) / Icm * 100).toFixed(0)}% of the centroidal value — moving mass away from the axis is expensive because I grows with distance squared.`;

  const code = `mass, size, d = ${mass}, ${size}, ${d}
c = ${c}  # ${SHAPES[shape].n}
Icm = c * mass * size**2
I = Icm + mass * d**2
print("Icm", Icm, "total I", I)`;

  return (
    <StudioChrome title="Moment of Inertia" tagline="rotational mass & the parallel-axis theorem"
      controls={<div>
        <label className="mb-2 block text-xs text-slate-400">Shape</label>
        <select value={shape} onChange={(e) => setShape(Number(e.target.value))} className="mb-3 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">{SHAPES.map((s, i) => <option key={s.n} value={i}>{s.n}</option>)}</select>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Mass (kg)" value={mass} min={0.5} max={10} step={0.5} onChange={(v) => update({ mass: v })} />
        <Slider label="Size R or L (m)" value={size} min={0.05} max={0.6} step={0.05} onChange={(v) => update({ size: v })} />
        <Slider label="Axis offset d (m)" value={d} min={0} max={0.6} step={0.05} onChange={(v) => update({ d: v })} />
        <p className="mt-3 text-xs text-slate-500">Moment of inertia is rotational mass: how hard it is to spin an object. Mass farther from the axis counts more (∝ r²). The parallel-axis theorem adds md² when the axis moves off the center of mass.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="I about center" value={`${Icm.toFixed(4)} kg·m²`} />
        <Stat label="Parallel-axis term" value={`${(mass * d * d).toFixed(4)} kg·m²`} />
        <Stat label="Total I" value={`${I.toFixed(4)} kg·m²`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
