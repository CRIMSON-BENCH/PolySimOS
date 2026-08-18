"use client";

import { useEffect, useRef, useState } from "react";
import { parse, evaluate } from "@/lib/engines/cas";
import { project } from "@/lib/engines/threeD";
import { StudioChrome, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 760, H = 480;

export function Surface3DStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expr, setExpr] = useState("sin(sqrt(x*x+y*y))");
  const [err, setErr] = useState("");
  const cam = useRef({ yaw: 0.7, pitch: -0.5, auto: true });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = hidpi(canvas, W, H);
    const onDown = (e: PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY }; cam.current.auto = false; };
    const onMove = (e: PointerEvent) => { if (!drag.current) return; cam.current.yaw += (e.clientX - drag.current.x) * 0.01; cam.current.pitch = Math.max(-1.4, Math.min(0.2, cam.current.pitch + (e.clientY - drag.current.y) * 0.01)); drag.current = { x: e.clientX, y: e.clientY }; };
    const onUp = () => (drag.current = null);
    canvas.addEventListener("pointerdown", onDown); window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);

    const loop = () => {
      let tree; try { tree = parse(expr); setErr(""); } catch (e) { setErr((e as Error).message); rafRef.current = requestAnimationFrame(loop); return; }
      const c = cam.current; if (c.auto) c.yaw += 0.004;
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const G = 34, span = 6, scale = 34;
      const grid: { x: number; y: number; z: number }[][] = [];
      for (let i = 0; i <= G; i++) { const row = []; for (let j = 0; j <= G; j++) {
        const x = -span / 2 + (span * i) / G, y = -span / 2 + (span * j) / G;
        let z = 0; try { z = evaluate(tree, { x, y }); } catch { z = 0; } if (!isFinite(z)) z = 0;
        row.push({ x: x * scale, y: z * scale, z: y * scale }); } grid.push(row); }
      const seg: { a: [number, number]; b: [number, number]; depth: number; z: number }[] = [];
      const pr = (p: { x: number; y: number; z: number }) => project(p, c.yaw, c.pitch, 420, W, H);
      for (let i = 0; i <= G; i++) for (let j = 0; j <= G; j++) {
        const p = pr(grid[i][j]);
        if (i < G) { const q = pr(grid[i + 1][j]); seg.push({ a: [p.sx2, p.sy2], b: [q.sx2, q.sy2], depth: (p.depth + q.depth) / 2, z: grid[i][j].y }); }
        if (j < G) { const q = pr(grid[i][j + 1]); seg.push({ a: [p.sx2, p.sy2], b: [q.sx2, q.sy2], depth: (p.depth + q.depth) / 2, z: grid[i][j].y }); }
      }
      seg.sort((a, b) => b.depth - a.depth);
      let minZ = Infinity, maxZ = -Infinity; for (const s of seg) { minZ = Math.min(minZ, s.z); maxZ = Math.max(maxZ, s.z); }
      for (const s of seg) { const t = (s.z - minZ) / (maxZ - minZ || 1); ctx.strokeStyle = `hsl(${240 - t * 180},80%,${35 + t * 30}%)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...s.a); ctx.lineTo(...s.b); ctx.stroke(); }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); canvas.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [expr]);

  const examples = ["sin(sqrt(x*x+y*y))", "x*x - y*y", "cos(x)*sin(y)", "exp(-(x*x+y*y)/4)", "sin(x)*cos(y)"];

  return (
    <StudioChrome title="3D Surface Plotter" tagline="z = f(x, y) · drag to orbit"
      controls={<div>
        <label className="mb-1 block text-xs text-slate-500">z = f(x, y)</label>
        <input value={expr} onChange={(e) => setExpr(e.target.value)} className="mb-2 w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        <div className="flex flex-wrap gap-1">{examples.map((ex) => <button key={ex} onClick={() => setExpr(ex)} className="rounded-md border border-slate-300 px-2 py-0.5 font-mono text-[10px] text-slate-600 dark:border-slate-700 dark:text-slate-400">{ex}</button>)}</div>
        {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
        <button onClick={() => (cam.current.auto = !cam.current.auto)} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-400">Toggle auto-rotate</button>
      </div>}
      inspector={<div><Stat label="Surface" value="wireframe" /><Stat label="Grid" value="34×34" /><Stat label="Variables" value="x, y" /></div>}
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full cursor-grab rounded-lg" />
    </StudioChrome>
  );
}
