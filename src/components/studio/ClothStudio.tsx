"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 760, H = 480;

interface P { x: number; y: number; px: number; py: number; pin: boolean; }

export function ClothStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const cols = 28, rows = 20, spacing = 16;
  const pts = useRef<P[]>([]);
  const grab = useRef<number | null>(null);
  const [running, setRunning] = useState(true);
  const [gravity, setGravity] = useState(0.4);
  const [wind, setWind] = useState(0);

  const reset = () => {
    const arr: P[] = []; const ox = W / 2 - (cols * spacing) / 2, oy = 40;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const px = ox + x * spacing, py = oy + y * spacing; arr.push({ x: px, y: py, px, py, pin: y === 0 && x % 4 === 0 }); }
    pts.current = arr;
  };
  useEffect(() => { reset(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = hidpi(canvas, W, H);
    const idx = (x: number, y: number) => y * cols + x;
    const rest = spacing;
    const onDown = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); const mx = (e.clientX - r.left) * (W / r.width), my = (e.clientY - r.top) * (H / r.height); let best = -1, bd = 400; pts.current.forEach((p, i) => { const dd = (p.x - mx) ** 2 + (p.y - my) ** 2; if (dd < bd) { bd = dd; best = i; } }); grab.current = best; };
    const onMove = (e: PointerEvent) => { if (grab.current === null) return; const r = canvas.getBoundingClientRect(); const p = pts.current[grab.current]; p.x = (e.clientX - r.left) * (W / r.width); p.y = (e.clientY - r.top) * (H / r.height); p.px = p.x; p.py = p.y; };
    const onUp = () => (grab.current = null);
    canvas.addEventListener("pointerdown", onDown); window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);

    const loop = () => {
      const arr = pts.current;
      if (running) {
        for (const p of arr) { if (p.pin) continue; const vx = (p.x - p.px) * 0.98 + wind, vy = (p.y - p.py) * 0.98 + gravity; p.px = p.x; p.py = p.y; p.x += vx; p.y += vy; if (p.y > H) p.y = H; }
        for (let k = 0; k < 3; k++) for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const constrain = (ax: number, ay: number, bx: number, by: number) => { const A = arr[idx(ax, ay)], B = arr[idx(bx, by)]; const dx = B.x - A.x, dy = B.y - A.y; const dist = Math.hypot(dx, dy) || 1; const diff = (dist - rest) / dist / 2; const ox = dx * diff, oy = dy * diff; if (!A.pin) { A.x += ox; A.y += oy; } if (!B.pin) { B.x -= ox; B.y -= oy; } };
          if (x < cols - 1) constrain(x, y, x + 1, y); if (y < rows - 1) constrain(x, y, x, y + 1);
        }
      }
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(34,211,238,0.5)"; ctx.lineWidth = 1; ctx.beginPath();
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const p = arr[idx(x, y)]; if (x < cols - 1) { const q = arr[idx(x + 1, y)]; ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); } if (y < rows - 1) { const q = arr[idx(x, y + 1)]; ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); } }
      ctx.stroke();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); canvas.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [running, gravity, wind]);

  return (
    <StudioChrome title="Cloth / Spring-Mass Studio" tagline="Verlet integration · constraint relaxation"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button><button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
        <p className="mb-3 text-xs text-slate-500">A grid of masses linked by springs, pinned at the top. Drag it around — it&apos;s a real Verlet cloth simulation.</p>
        <Slider label="Gravity" value={gravity} min={0} max={1.2} step={0.05} onChange={setGravity} />
        <Slider label="Wind" value={wind} min={-1} max={1} step={0.05} onChange={setWind} />
      </div>}
      inspector={<div><Stat label="Nodes" value={`${cols}×${rows}`} /><Stat label="Integrator" value="Verlet" /><Stat label="Constraints" value="distance (×3/frame)" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full cursor-grab rounded-lg" /></StudioChrome>
  );
}
