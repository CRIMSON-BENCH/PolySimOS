"use client";

import { useEffect, useRef, useState } from "react";
import { project } from "@/lib/engines/threeD";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 760, H = 480;

export function GravityWellStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const cam = useRef({ yaw: 0.6, pitch: -0.6 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [mass, setMass] = useState(60);
  const body = useRef({ x: 90, z: 0, vx: 0, vz: 1.4 });

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = hidpi(canvas, W, H);
    const onDown = (e: PointerEvent) => (drag.current = { x: e.clientX, y: e.clientY });
    const onMove = (e: PointerEvent) => { if (!drag.current) return; cam.current.yaw += (e.clientX - drag.current.x) * 0.01; cam.current.pitch = Math.max(-1.3, Math.min(-0.1, cam.current.pitch + (e.clientY - drag.current.y) * 0.01)); drag.current = { x: e.clientX, y: e.clientY }; };
    const onUp = () => (drag.current = null);
    canvas.addEventListener("pointerdown", onDown); window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
    const depth = (r: number) => -mass * 120 / (r + 18);
    const loop = () => {
      const c = cam.current;
      // orbit body under 1/r^2 in the plane
      const b = body.current; const r = Math.hypot(b.x, b.z) || 1; const f = -mass * 0.9 / (r * r * r);
      b.vx += f * b.x; b.vz += f * b.z; b.x += b.vx; b.z += b.vz;
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const G = 26, span = 260, sc = 1;
      const pr = (x: number, z: number) => project({ x: x * sc, y: depth(Math.hypot(x, z)), z: z * sc }, c.yaw, c.pitch, 620, W, H);
      ctx.lineWidth = 1;
      for (let i = 0; i <= G; i++) for (let j = 0; j <= G; j++) {
        const x = -span / 2 + (span * i) / G, z = -span / 2 + (span * j) / G;
        const p = pr(x, z); const t = Math.min(1, -depth(Math.hypot(x, z)) / (mass * 6));
        ctx.strokeStyle = `hsla(${210 - t * 60},70%,${30 + t * 30}%,0.6)`;
        if (i < G) { const q = pr(x + span / G, z); ctx.beginPath(); ctx.moveTo(p.sx2, p.sy2); ctx.lineTo(q.sx2, q.sy2); ctx.stroke(); }
        if (j < G) { const q = pr(x, z + span / G); ctx.beginPath(); ctx.moveTo(p.sx2, p.sy2); ctx.lineTo(q.sx2, q.sy2); ctx.stroke(); }
      }
      const bp = pr(b.x, b.z); ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(bp.sx2, bp.sy2, 6, 0, 7); ctx.fill();
      const cp = pr(0, 0); ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(cp.sx2, cp.sy2, 8, 0, 7); ctx.fill();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); canvas.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [mass]);

  return (
    <StudioChrome title="Gravity Well Studio" tagline="curved spacetime · rubber-sheet analogy"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">The classic rubber-sheet picture of gravity: mass warps the grid, and a body orbits in the curved surface. Drag to look around.</p>
        <Slider label="Central mass" value={mass} min={20} max={120} step={5} onChange={setMass} />
        <button onClick={() => (body.current = { x: 90, z: 0, vx: 0, vz: 1.4 })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset orbit</button>
      </div>}
      inspector={<div><Stat label="Central mass" value={String(mass)} /><Stat label="Well depth" value="∝ M/r" /><Stat label="View" value="3D orbit" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full cursor-grab rounded-lg" /></StudioChrome>
  );
}
