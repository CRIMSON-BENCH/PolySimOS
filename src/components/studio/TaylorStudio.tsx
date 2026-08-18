"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parse, derivative, evaluate, simplify, sampleExpr, Node } from "@/lib/engines/cas";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 760, H = 480;

export function TaylorStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expr, setExpr] = useState("sin(x)");
  const [order, setOrder] = useState(5);
  const [center, setCenter] = useState(0);
  const [err, setErr] = useState("");

  const taylor = useMemo(() => {
    try {
      setErr("");
      let tree = parse(expr); const derivs: Node[] = [tree];
      for (let k = 1; k <= order; k++) { tree = simplify(derivative(tree, "x")); derivs.push(tree); }
      const coeffs: number[] = []; let fact = 1;
      for (let k = 0; k <= order; k++) { if (k > 0) fact *= k; coeffs.push(evaluate(derivs[k], { x: center }) / fact); }
      return (x: number) => coeffs.reduce((s, c, k) => s + c * Math.pow(x - center, k), 0);
    } catch (e) { setErr((e as Error).message); return null; }
  }, [expr, order, center]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    let f: { x: number; y: number }[] = []; try { f = sampleExpr(expr, "x", -10, 10, 500); } catch { /* */ }
    const ys = f.map((p) => p.y).filter(isFinite); let minY = Math.max(-8, Math.min(...ys, -2)), maxY = Math.min(8, Math.max(...ys, 2));
    if (!isFinite(minY) || minY === maxY) { minY = -4; maxY = 4; }
    const pad = 34; const sx = (x: number) => pad + ((x + 10) / 20) * (W - 2 * pad); const sy = (y: number) => H - pad - ((y - minY) / (maxY - minY || 1)) * (H - 2 * pad);
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); if (minY < 0 && maxY > 0) { ctx.moveTo(pad, sy(0)); ctx.lineTo(W - pad, sy(0)); } ctx.moveTo(sx(0), pad); ctx.lineTo(sx(0), H - pad); ctx.stroke();
    const draw = (fn: (x: number) => number, color: string, wdt: number) => { ctx.strokeStyle = color; ctx.lineWidth = wdt; ctx.beginPath(); let pen = false; for (let px = pad; px <= W - pad; px++) { const x = -10 + ((px - pad) / (W - 2 * pad)) * 20; const y = fn(x); if (!isFinite(y) || y < minY - 5 || y > maxY + 5) { pen = false; continue; } pen ? ctx.lineTo(px, sy(y)) : ctx.moveTo(px, sy(y)); pen = true; } ctx.stroke(); };
    try { draw((x) => evaluate(parse(expr), { x }), "#22d3ee", 2.5); } catch { /* */ }
    if (taylor) draw(taylor, "#a3e635", 2);
    ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(sx(center), sy(taylor ? taylor(center) : 0), 5, 0, 7); ctx.fill();
    ctx.font = "12px system-ui"; ctx.fillStyle = "#22d3ee"; ctx.fillText("f(x)", pad, 22); ctx.fillStyle = "#a3e635"; ctx.fillText(`Taylor (order ${order})`, pad + 60, 22);
  }, [expr, taylor, order, center]);

  return (
    <StudioChrome title="Taylor Series Visualizer" tagline="polynomial approximation via the CAS"
      controls={<div>
        <label className="mb-1 block text-xs text-slate-500">f(x)</label>
        <input value={expr} onChange={(e) => setExpr(e.target.value)} className="mb-3 w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        <div className="flex flex-wrap gap-1 mb-3">{["sin(x)", "exp(x)", "cos(x)", "ln(x+2)", "1/(1+x*x)"].map((ex) => <button key={ex} onClick={() => setExpr(ex)} className="rounded-md border border-slate-300 px-2 py-0.5 font-mono text-[10px] text-slate-600 dark:border-slate-700 dark:text-slate-400">{ex}</button>)}</div>
        <Slider label="Order" value={order} min={1} max={15} step={1} onChange={setOrder} />
        <Slider label="Center a" value={center} min={-6} max={6} step={0.5} onChange={setCenter} />
        {err && <p className="text-xs text-red-500">{err}</p>}
      </div>}
      inspector={<div><Stat label="Order" value={String(order)} /><Stat label="Center" value={String(center)} /><Stat label="Method" value="symbolic derivatives" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
