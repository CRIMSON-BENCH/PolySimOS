"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { project } from "@/lib/engines/threeD";
import { hidpi } from "@/lib/studioKit";
import { StudioChrome, Stat } from "./StudioChrome";

const W = 760, H = 480;
type V3 = [number, number, number];

const ATTRACTORS: Record<string, { name: string; f: (p: V3) => V3; dt: number; scale: number; start: V3 }> = {
  lorenz: { name: "Lorenz", f: ([x, y, z]) => [10 * (y - x), x * (28 - z) - y, x * y - (8 / 3) * z], dt: 0.006, scale: 6, start: [1, 1, 1] },
  rossler: { name: "Rössler", f: ([x, y, z]) => [-y - z, x + 0.2 * y, 0.2 + z * (x - 5.7)], dt: 0.015, scale: 14, start: [1, 1, 1] },
  thomas: { name: "Thomas", f: ([x, y, z]) => [Math.sin(y) - 0.19 * x, Math.sin(z) - 0.19 * y, Math.sin(x) - 0.19 * z], dt: 0.05, scale: 42, start: [1.1, 1.1, -0.5] },
  aizawa: { name: "Aizawa", f: ([x, y, z]) => [(z - 0.7) * x - 3.5 * y, 3.5 * x + (z - 0.7) * y, 0.6 + 0.95 * z - (z ** 3) / 3 - (x * x + y * y) * (1 + 0.25 * z) + 0.1 * z * x ** 3], dt: 0.01, scale: 80, start: [0.1, 0, 0] },
  halvorsen: { name: "Halvorsen", f: ([x, y, z]) => [-1.4 * x - 4 * y - 4 * z - y * y, -1.4 * y - 4 * z - 4 * x - z * z, -1.4 * z - 4 * x - 4 * y - x * x], dt: 0.008, scale: 16, start: [-5, 0, 0] },
};

export function AttractorStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState("lorenz");
  const cam = useRef({ yaw: 0.5, pitch: -0.3, auto: true });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef(0);

  const pts = useMemo(() => {
    const a = ATTRACTORS[key]; let p = a.start.slice() as V3; const out: V3[] = [];
    for (let i = 0; i < 20000; i++) { const d = a.f(p); p = [p[0] + d[0] * a.dt, p[1] + d[1] * a.dt, p[2] + d[2] * a.dt]; if (i > 200) out.push([p[0] * a.scale, p[1] * a.scale, p[2] * a.scale]); }
    return out;
  }, [key]);

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = hidpi(canvas, W, H);
    const onDown = (e: PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY }; cam.current.auto = false; };
    const onMove = (e: PointerEvent) => { if (!drag.current) return; cam.current.yaw += (e.clientX - drag.current.x) * 0.01; cam.current.pitch = Math.max(-1.4, Math.min(1.4, cam.current.pitch + (e.clientY - drag.current.y) * 0.01)); drag.current = { x: e.clientX, y: e.clientY }; };
    const onUp = () => (drag.current = null);
    canvas.addEventListener("pointerdown", onDown); window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
    const loop = () => {
      const c = cam.current; if (c.auto) c.yaw += 0.003;
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      let cx = 0, cy = 0, cz = 0; for (const p of pts) { cx += p[0]; cy += p[1]; cz += p[2]; } cx /= pts.length; cy /= pts.length; cz /= pts.length;
      ctx.lineWidth = 0.6;
      let prev: { sx2: number; sy2: number } | null = null;
      for (let i = 0; i < pts.length; i++) { const pr = project({ x: pts[i][0] - cx, y: pts[i][1] - cy, z: pts[i][2] - cz }, c.yaw, c.pitch, 500, W, H);
        if (prev && pr.depth > 1) { const t = i / pts.length; ctx.strokeStyle = `hsl(${190 - t * 130},90%,62%)`; ctx.beginPath(); ctx.moveTo(prev.sx2, prev.sy2); ctx.lineTo(pr.sx2, pr.sy2); ctx.stroke(); }
        prev = pr; }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); canvas.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [pts]);

  return (
    <StudioChrome title="Strange Attractor Gallery" tagline="3D chaos · drag to orbit"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Five famous strange attractors in 3D. Drag to orbit around the chaos.</p>
        <div className="flex flex-wrap gap-1.5">{Object.entries(ATTRACTORS).map(([k, a]) => <button key={k} onClick={() => setKey(k)} className={`rounded-lg px-3 py-1 text-xs font-semibold ${key === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{a.name}</button>)}</div>
        <button onClick={() => (cam.current.auto = !cam.current.auto)} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-400">Toggle auto-rotate</button>
      </div>}
      inspector={<div><Stat label="Attractor" value={ATTRACTORS[key].name} /><Stat label="Points" value={pts.length.toLocaleString()} /><Stat label="Type" value="Strange / chaotic" /></div>}
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full cursor-grab rounded-lg" />
    </StudioChrome>
  );
}
