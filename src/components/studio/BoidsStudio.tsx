"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 480;
interface B { x: number; y: number; vx: number; vy: number; }

const PRESETS: Record<string, { n: number; align: number; cohere: number; separate: number }> = {
  "Tight flock": { n: 160, align: 2, cohere: 2.5, separate: 0.6 },
  "Loose scatter": { n: 100, align: 0.5, cohere: 0.3, separate: 2.5 },
  "In lockstep": { n: 140, align: 3, cohere: 1, separate: 1 },
  "Dense crowd": { n: 300, align: 0.8, cohere: 1.5, separate: 2 },
};

export function BoidsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boids = useRef<B[]>([]);
  const rafRef = useRef(0);
  const [{ n, align, cohere, separate }, update] = useShareableNumbers({ n: 140, align: 1, cohere: 1, separate: 1.4 });

  useEffect(() => { boids.current = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 })); }, [n]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    const loop = () => {
      const bs = boids.current; const R = 45, sepR = 20, maxV = 4;
      for (const b of bs) {
        let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, cnt = 0;
        for (const o of bs) { if (o === b) continue; const dx = o.x - b.x, dy = o.y - b.y; const d2 = dx * dx + dy * dy; if (d2 < R * R) { ax += o.vx; ay += o.vy; cx += o.x; cy += o.y; cnt++; if (d2 < sepR * sepR) { sx -= dx; sy -= dy; } } }
        if (cnt) { ax /= cnt; ay /= cnt; cx = cx / cnt - b.x; cy = cy / cnt - b.y; b.vx += (ax - b.vx) * 0.05 * align + cx * 0.0008 * cohere + sx * 0.04 * separate; b.vy += (ay - b.vy) * 0.05 * align + cy * 0.0008 * cohere + sy * 0.04 * separate; }
        const sp = Math.hypot(b.vx, b.vy) || 1; if (sp > maxV) { b.vx = b.vx / sp * maxV; b.vy = b.vy / sp * maxV; }
        b.x = (b.x + b.vx + W) % W; b.y = (b.y + b.vy + H) % H;
      }
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      for (const b of bs) { const a = Math.atan2(b.vy, b.vx); ctx.fillStyle = `hsl(${190 - Math.hypot(b.vx, b.vy) * 12},90%,62%)`; ctx.beginPath(); ctx.moveTo(b.x + Math.cos(a) * 7, b.y + Math.sin(a) * 7); ctx.lineTo(b.x + Math.cos(a + 2.5) * 5, b.y + Math.sin(a + 2.5) * 5); ctx.lineTo(b.x + Math.cos(a - 2.5) * 5, b.y + Math.sin(a - 2.5) * 5); ctx.closePath(); ctx.fill(); }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [align, cohere, separate]);

  const explain =
    separate > cohere + 1
      ? "Separation dominates: boids push apart before they can group, so the flock stays sparse and scattered."
      : cohere > separate + 1
      ? "Cohesion dominates: neighbors pull together into tight clumps that tend to collapse into a single blob."
      : align > 2
      ? "Strong alignment: boids match headings and sweep across the field in near-unison, like a starling murmuration."
      : "Balanced rules: alignment, cohesion, and separation trade off to produce the classic lifelike flock — order with no leader.";

  const code = `import numpy as np
N, align, cohere, separate = ${n}, ${align}, ${cohere}, ${separate}
W, H, R, sepR, maxV = 760, 480, 45, 20, 4
p = np.random.rand(N, 2) * [W, H]; v = (np.random.rand(N, 2) - 0.5) * 4
for step in range(500):
    for i in range(N):
        d = p - p[i]; dist2 = (d ** 2).sum(1); m = dist2 < R * R; m[i] = False
        if m.any():
            avg_v = v[m].mean(0); avg_p = p[m].mean(0)
            sep = -d[dist2 < sepR * sepR].sum(0)
            v[i] += (avg_v - v[i]) * 0.05 * align + (avg_p - p[i]) * 0.0008 * cohere + sep * 0.04 * separate
        s = np.hypot(*v[i]) or 1
        if s > maxV: v[i] *= maxV / s
    p = (p + v) % [W, H]`;

  return (
    <StudioChrome title="Boids Flocking Studio" tagline="emergent flocking · 3 simple rules"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Three local rules — alignment, cohesion, separation — produce lifelike flocking with no leader and no global plan.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Boids" value={n} min={40} max={300} step={20} onChange={(v) => update({ n: v })} />
        <Slider label="Alignment" value={align} min={0} max={3} step={0.1} onChange={(v) => update({ align: v })} />
        <Slider label="Cohesion" value={cohere} min={0} max={3} step={0.1} onChange={(v) => update({ cohere: v })} />
        <Slider label="Separation" value={separate} min={0} max={3} step={0.1} onChange={(v) => update({ separate: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Boids" value={String(n)} /><Stat label="Rules" value="align · cohere · separate" /><Stat label="Behavior" value="emergent flocking" /><Equation tex={`\\vec{v}_i \\leftarrow \\vec{v}_i + ${align.toFixed(1)}\\,(\\bar{\\vec{v}} - \\vec{v}_i) + ${cohere.toFixed(1)}\\,(\\bar{\\vec{p}} - \\vec{p}_i) + ${separate.toFixed(1)}\\!\\sum_{j}(\\vec{p}_i - \\vec{p}_j)`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
