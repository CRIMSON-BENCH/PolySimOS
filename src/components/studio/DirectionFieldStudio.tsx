"use client";

import { useEffect, useRef, useState } from "react";
import { parse, evaluate } from "@/lib/engines/cas";
import { StudioChrome, Stat } from "./StudioChrome";

const W = 640, H = 480;

export function DirectionFieldStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expr, setExpr] = useState("y - x");
  const [err, setErr] = useState("");
  const seeds = useRef<[number, number][]>([]);

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!;
    let tree; try { tree = parse(expr); setErr(""); } catch (e) { setErr((e as Error).message); return; }
    const span = 6; const toX = (x: number) => W / 2 + (x / span) * (W / 2); const toY = (y: number) => H / 2 - (y / span) * (H / 2);
    const f = (x: number, y: number) => { try { return evaluate(tree, { x, y }); } catch { return 0; } };
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.strokeStyle = "rgba(148,163,184,0.6)"; ctx.lineWidth = 1;
    for (let gx = -span; gx <= span; gx += 0.6) for (let gy = -span; gy <= span; gy += 0.6) { const slope = f(gx, gy); const ang = Math.atan(slope); const len = 12; const cx = toX(gx), cy = toY(gy); ctx.beginPath(); ctx.moveTo(cx - Math.cos(ang) * len / 2, cy + Math.sin(ang) * len / 2); ctx.lineTo(cx + Math.cos(ang) * len / 2, cy - Math.sin(ang) * len / 2); ctx.stroke(); }
    // solution curves from seeds
    ctx.lineWidth = 2; ctx.strokeStyle = "#22d3ee";
    for (const [sx, sy] of seeds.current) { for (const dir of [1, -1]) { let x = sx, y = sy; ctx.beginPath(); ctx.moveTo(toX(x), toY(y)); for (let i = 0; i < 400; i++) { const k1 = f(x, y); const k2 = f(x + dir * 0.02 / 2, y + dir * 0.02 / 2 * k1); y += dir * 0.02 * k2; x += dir * 0.02; if (Math.abs(x) > span || Math.abs(y) > span) break; ctx.lineTo(toX(x), toY(y)); } ctx.stroke(); } }
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("dy/dx = " + expr + " · click to draw a solution curve", 12, 20);
  }, [expr, seeds.current.length]);

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => { const r = e.currentTarget.getBoundingClientRect(); const span = 6; const x = ((e.clientX - r.left) / r.width * W - W / 2) / (W / 2) * span; const y = -((e.clientY - r.top) / r.height * H - H / 2) / (H / 2) * span; seeds.current = [...seeds.current, [x, y]]; };

  return (
    <StudioChrome title="Direction Field / Slope Field" tagline="dy/dx = f(x, y) · click for solutions"
      controls={<div>
        <label className="mb-1 block text-xs text-slate-500">dy/dx = f(x, y)</label>
        <input value={expr} onChange={(e) => setExpr(e.target.value)} className="mb-2 w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        <div className="flex flex-wrap gap-1">{["y - x", "-x/y", "x*y", "sin(x) - y", "1 - y*y"].map((ex) => <button key={ex} onClick={() => { setExpr(ex); seeds.current = []; }} className="rounded-md border border-slate-300 px-2 py-0.5 font-mono text-[10px] text-slate-600 dark:border-slate-700 dark:text-slate-400">{ex}</button>)}</div>
        <button onClick={() => (seeds.current = [])} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Clear curves</button>
        {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
      </div>}
      inspector={<div><Stat label="Equation" value="dy/dx = f(x,y)" /><Stat label="Curves" value={String(seeds.current.length)} /><Stat label="Integrator" value="RK2" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} onClick={onClick} className="mx-auto h-auto max-h-[460px] cursor-crosshair rounded-lg" /></StudioChrome>
  );
}
