"use client";

import { useEffect, useRef, useState } from "react";
import { Body3, seedSystem3D, stepSystem3D, project } from "@/lib/engines/threeD";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 760, H = 480;

export function Studio3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bodiesRef = useRef<Body3[]>([]);
  const rafRef = useRef(0);
  const cam = useRef({ yaw: 0.6, pitch: 0.35, dist: 320, autoRotate: true });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [running, setRunning] = useState(true);
  const [count, setCount] = useState(80);
  const [G, setG] = useState(0.5);

  useEffect(() => { bodiesRef.current = seedSystem3D(count); }, [count]);

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!;
    const onDown = (e: PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY }; cam.current.autoRotate = false; };
    const onMove = (e: PointerEvent) => { if (!drag.current) return; cam.current.yaw += (e.clientX - drag.current.x) * 0.01; cam.current.pitch = Math.max(-1.4, Math.min(1.4, cam.current.pitch + (e.clientY - drag.current.y) * 0.01)); drag.current = { x: e.clientX, y: e.clientY }; };
    const onUp = () => (drag.current = null);
    const onWheel = (e: WheelEvent) => { e.preventDefault(); cam.current.dist = Math.max(120, Math.min(800, cam.current.dist + e.deltaY * 0.3)); };
    canvas.addEventListener("pointerdown", onDown); window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp); canvas.addEventListener("wheel", onWheel, { passive: false });

    const loop = () => {
      const bodies = bodiesRef.current; const c = cam.current;
      if (running) { for (let s = 0; s < 2; s++) stepSystem3D(bodies, G, 0.5); }
      if (c.autoRotate) c.yaw += 0.003;
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const projected = bodies.map((b) => ({ b, p: project(b, c.yaw, c.pitch, c.dist, W, H) })).sort((a, z) => z.p.depth - a.p.depth);
      for (const { b, p } of projected) {
        if (p.depth <= 1) continue;
        const rad = Math.max(1, b.r * p.scale);
        const speed = Math.hypot(b.vx, b.vy, b.vz);
        ctx.beginPath(); ctx.fillStyle = b.fixed ? "#a3e635" : `hsl(${200 - Math.min(140, speed * 8)},90%,${Math.min(70, 40 + p.scale * 30)}%)`;
        ctx.arc(p.sx2, p.sy2, rad, 0, Math.PI * 2); ctx.fill();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); canvas.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); canvas.removeEventListener("wheel", onWheel); };
  }, [running, G]);

  return (
    <StudioChrome
      title="3D N-Body Studio"
      tagline="3D gravitation · orbit camera"
      controls={
        <div>
          <div className="mb-3 flex gap-2">
            <button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button>
            <button onClick={() => (bodiesRef.current = seedSystem3D(count))} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Reset</button>
          </div>
          <p className="mb-3 text-xs text-slate-500">Drag to orbit · scroll to zoom.</p>
          <Slider label="Bodies" value={count} min={20} max={220} step={10} onChange={setCount} />
          <Slider label="Gravity G" value={G} min={0.1} max={1.5} step={0.05} onChange={setG} />
          <button onClick={() => (cam.current.autoRotate = !cam.current.autoRotate)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-400">Toggle auto-rotate</button>
        </div>
      }
      inspector={<div><Stat label="Bodies" value={String(count + 1)} /><Stat label="Integrator" value="Symplectic Euler" /><Stat label="Dimensions" value="3D" /></div>}
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full cursor-grab rounded-lg" />
    </StudioChrome>
  );
}
