"use client";

import { useEffect, useRef, useState } from "react";
import { parse, evaluate } from "@/lib/engines/cas";
import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useCanvasDrag } from "@/lib/studioKit";

const W = 640, H = 480;
const SPAN = 6;
const toX = (x: number) => W / 2 + (x / SPAN) * (W / 2);
const toY = (y: number) => H / 2 - (y / SPAN) * (H / 2);

export function DirectionFieldStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expr, setExpr] = useState("y - x");
  const [err, setErr] = useState("");
  // The draggable initial-condition point (seed of the live solution curve) lives in React state.
  const [seed, setSeed] = useState<[number, number]>([1, 1]);
  const seeds = useRef<[number, number][]>([]);
  const [pinCount, setPinCount] = useState(0); // forces a redraw when curves are pinned/cleared
  const didDrag = useRef(false);

  // Drag the initial-condition handle anywhere on the field; the integral curve redraws live.
  useCanvasDrag(canvasRef, W, H, {
    pick: (px, py) => { didDrag.current = false; return Math.hypot(toX(seed[0]) - px, toY(seed[1]) - py) < 16; },
    move: (px, py) => {
      didDrag.current = true;
      const x = ((px - W / 2) / (W / 2)) * SPAN;
      const y = -((py - H / 2) / (H / 2)) * SPAN;
      setSeed([x, y]);
    },
  });

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = hidpi(canvas, W, H);
    let tree; try { tree = parse(expr); setErr(""); } catch (e) { setErr((e as Error).message); return; }
    const span = SPAN;
    const f = (x: number, y: number) => { try { return evaluate(tree, { x, y }); } catch { return 0; } };
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.strokeStyle = "rgba(148,163,184,0.6)"; ctx.lineWidth = 1;
    for (let gx = -span; gx <= span; gx += 0.6) for (let gy = -span; gy <= span; gy += 0.6) { const slope = f(gx, gy); const ang = Math.atan(slope); const len = 12; const cx = toX(gx), cy = toY(gy); ctx.beginPath(); ctx.moveTo(cx - Math.cos(ang) * len / 2, cy + Math.sin(ang) * len / 2); ctx.lineTo(cx + Math.cos(ang) * len / 2, cy - Math.sin(ang) * len / 2); ctx.stroke(); }
    // integral curve through a seed point, tangent to the field everywhere (RK2)
    const drawCurve = (sx: number, sy: number, color: string) => { ctx.strokeStyle = color; for (const dir of [1, -1]) { let x = sx, y = sy; ctx.beginPath(); ctx.moveTo(toX(x), toY(y)); for (let i = 0; i < 400; i++) { const k1 = f(x, y); const k2 = f(x + dir * 0.02 / 2, y + dir * 0.02 / 2 * k1); y += dir * 0.02 * k2; x += dir * 0.02; if (Math.abs(x) > span || Math.abs(y) > span) break; ctx.lineTo(toX(x), toY(y)); } ctx.stroke(); } };
    ctx.lineWidth = 2;
    // pinned curves from earlier clicks
    for (const [sx, sy] of seeds.current) drawCurve(sx, sy, "#22d3ee");
    // live curve through the draggable seed
    drawCurve(seed[0], seed[1], "#a3e635");
    // draggable initial-condition handle
    ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(toX(seed[0]), toY(seed[1]), 7, 0, 7); ctx.fill();
    ctx.strokeStyle = "#020617"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(toX(seed[0]), toY(seed[1]), 7, 0, 7); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("dy/dx = " + expr + " · drag the start point, or click to pin another curve", 12, 20);
  }, [expr, seed, pinCount]);

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (didDrag.current) { didDrag.current = false; return; } // a drag just ended — don't also pin a curve
    const r = e.currentTarget.getBoundingClientRect(); const span = SPAN; const x = ((e.clientX - r.left) / r.width * W - W / 2) / (W / 2) * span; const y = -((e.clientY - r.top) / r.height * H - H / 2) / (H / 2) * span; seeds.current = [...seeds.current, [x, y]]; setPinCount((n) => n + 1);
  };

  const explain = err
    ? "Fix the expression above — dy/dx must be a valid function of x and y before a field can be drawn."
    : "Every tick shows the slope dy/dx = f(x,y) at that point; drag the start point and RK2 rethreads the solution curve live, always staying tangent to the arrows. That start point alone picks which one curve you get — click elsewhere to pin extra curves for comparison.";

  const code = `import numpy as np
from numpy import sin, cos, tan, exp, log, sqrt
f = lambda x, y: ${expr}          # dy/dx = f(x, y)
x, y, dx = 0.0, 1.0, 0.02         # start point + step
xs, ys = [x], [y]
for _ in range(400):              # RK2 (midpoint) integration
    k1 = f(x, y)
    k2 = f(x + dx / 2, y + dx / 2 * k1)
    x += dx; y += dx * k2
    xs.append(x); ys.append(y)
print(xs[-1], ys[-1])`;

  return (
    <StudioChrome title="Direction Field / Slope Field" tagline="dy/dx = f(x, y) · drag the start point"
      controls={<div>
        <label className="mb-1 block text-xs text-slate-500">dy/dx = f(x, y)</label>
        <input value={expr} onChange={(e) => setExpr(e.target.value)} className="mb-2 w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        <div className="flex flex-wrap gap-1">{["y - x", "-x/y", "x*y", "sin(x) - y", "1 - y*y"].map((ex) => <button key={ex} onClick={() => { setExpr(ex); seeds.current = []; setPinCount((n) => n + 1); }} className="rounded-md border border-slate-300 px-2 py-0.5 font-mono text-[10px] text-slate-600 dark:border-slate-700 dark:text-slate-400">{ex}</button>)}</div>
        <button onClick={() => { seeds.current = []; setPinCount((n) => n + 1); }} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Clear pinned curves</button>
        {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Equation" value="dy/dx = f(x,y)" /><Stat label="Curves" value={String(seeds.current.length + 1)} /><Stat label="Integrator" value="RK2" /><Equation tex={`\\frac{dy}{dx} = f(x,y) = ${expr}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} onClick={onClick} className="mx-auto h-auto max-h-[460px] cursor-crosshair rounded-lg" /></StudioChrome>
  );
}
