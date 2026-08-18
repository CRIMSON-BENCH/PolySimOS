"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const SHAPES = [{ n: "Solid disk", c: 0.5 }, { n: "Hoop / ring", c: 1 }, { n: "Solid sphere", c: 0.4 }, { n: "Rod (center)", c: 1 / 12 }];

export function MomentOfInertiaStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shape, setShape] = useState(0);
  const [mass, setMass] = useState(2);
  const [size, setSize] = useState(0.3);
  const [d, setD] = useState(0);

  const c = SHAPES[shape].c, Icm = c * mass * size * size, I = Icm + mass * d * d;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = size * 260, axoff = d * 260;
    ctx.strokeStyle = "#f472b6"; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(cx - axoff, 20); ctx.lineTo(cx - axoff, H - 20); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = 0.85;
    if (shape === 0) { ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); }
    else if (shape === 1) { ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = Math.max(6, R * 0.15); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); }
    else if (shape === 2) { const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 4, cx, cy, R); g.addColorStop(0, "#67e8f9"); g.addColorStop(1, "#0891b2"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.fillStyle = "#22d3ee"; ctx.fillRect(cx - R, cy - 9, R * 2, 18); }
    ctx.globalAlpha = 1; ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("pink = rotation axis (offset with slider)", 12, 20);
  }, [shape, size, d]);

  return (
    <StudioChrome title="Moment of Inertia" tagline="rotational mass & the parallel-axis theorem"
      controls={<div>
        <label className="mb-2 block text-xs text-slate-400">Shape</label>
        <select value={shape} onChange={(e) => setShape(Number(e.target.value))} className="mb-3 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">{SHAPES.map((s, i) => <option key={s.n} value={i}>{s.n}</option>)}</select>
        <Slider label="Mass (kg)" value={mass} min={0.5} max={10} step={0.5} onChange={setMass} />
        <Slider label="Size R or L (m)" value={size} min={0.05} max={0.6} step={0.05} onChange={setSize} />
        <Slider label="Axis offset d (m)" value={d} min={0} max={0.6} step={0.05} onChange={setD} />
        <p className="mt-3 text-xs text-slate-500">Moment of inertia is rotational mass: how hard it is to spin an object. Mass farther from the axis counts more (∝ r²). The parallel-axis theorem adds md² when the axis moves off the center of mass.</p>
      </div>}
      inspector={<div>
        <Stat label="I about center" value={`${Icm.toFixed(4)} kg·m²`} />
        <Stat label="Parallel-axis term" value={`${(mass * d * d).toFixed(4)} kg·m²`} />
        <Stat label="Total I" value={`${I.toFixed(4)} kg·m²`} />
      </div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
