"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 760, H = 480;
interface B { x: number; y: number; vx: number; vy: number; }

export function BoidsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boids = useRef<B[]>([]);
  const rafRef = useRef(0);
  const [n, setN] = useState(140);
  const [align, setAlign] = useState(1);
  const [cohere, setCohere] = useState(1);
  const [separate, setSeparate] = useState(1.4);

  useEffect(() => { boids.current = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 })); }, [n]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
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

  return (
    <StudioChrome title="Boids Flocking Studio" tagline="emergent flocking · 3 simple rules"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Three local rules — alignment, cohesion, separation — produce lifelike flocking with no leader and no global plan.</p>
        <Slider label="Boids" value={n} min={40} max={300} step={20} onChange={setN} />
        <Slider label="Alignment" value={align} min={0} max={3} step={0.1} onChange={setAlign} />
        <Slider label="Cohesion" value={cohere} min={0} max={3} step={0.1} onChange={setCohere} />
        <Slider label="Separation" value={separate} min={0} max={3} step={0.1} onChange={setSeparate} />
      </div>}
      inspector={<div><Stat label="Boids" value={String(n)} /><Stat label="Rules" value="align · cohere · separate" /><Stat label="Behavior" value="emergent flocking" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
