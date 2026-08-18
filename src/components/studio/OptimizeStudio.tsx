"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { minimize1D, monteCarloUQ } from "@/lib/engines/fieldmath";
import { sampleExpr } from "@/lib/engines/cas";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 720, H = 460;

export function OptimizeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expr, setExpr] = useState("x^4 - 3*x^2 + x");
  const [x0, setX0] = useState(2.5);
  const [sd, setSd] = useState(0.4);
  const [err, setErr] = useState("");

  const opt = useMemo(() => { try { setErr(""); return minimize1D(expr, -3, 3, x0); } catch (e) { setErr((e as Error).message); return null; } }, [expr, x0]);
  const uq = useMemo(() => { try { return opt ? monteCarloUQ(expr, opt.x, sd, 4000) : null; } catch { return null; } }, [expr, opt, sd]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    let data: { x: number; y: number }[] = []; try { data = sampleExpr(expr, "x", -3, 3, 400); } catch { /* */ }
    const ys = data.map((d) => d.y).filter(isFinite); let minY = Math.min(...ys), maxY = Math.max(...ys); if (!isFinite(minY)) { minY = -1; maxY = 1; }
    const pad = 30; const sx = (x: number) => pad + ((x + 3) / 6) * (W - 2 * pad); const sy = (y: number) => H - pad - ((y - minY) / (maxY - minY || 1)) * (H - 2 * pad);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); let pen = false;
    for (const d of data) { if (!isFinite(d.y)) { pen = false; continue; } const X = sx(d.x), Y = sy(d.y); pen ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); pen = true; } ctx.stroke();
    if (opt) { // descent path
      ctx.fillStyle = "rgba(163,230,53,0.5)"; opt.path.forEach((p) => { ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), 3, 0, 7); ctx.fill(); });
      ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(sx(opt.x), sy(opt.fx), 7, 0, 7); ctx.fill();
      ctx.fillStyle = "#e2e8f0"; ctx.font = "12px system-ui"; ctx.fillText(`min ≈ (${opt.x.toFixed(3)}, ${opt.fx.toFixed(3)})`, sx(opt.x) + 10, sy(opt.fx) - 8);
    }
  }, [expr, opt]);

  return (
    <StudioChrome
      title="Optimization + Uncertainty Studio"
      tagline="gradient descent · Monte-Carlo UQ"
      controls={
        <div>
          <label className="mb-1 block text-xs text-slate-500">Objective f(x)</label>
          <input value={expr} onChange={(e) => setExpr(e.target.value)} className="mb-3 w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          <Slider label="Start x₀" value={x0} min={-3} max={3} step={0.1} onChange={setX0} />
          <Slider label="Input σ (uncertainty)" value={sd} min={0.05} max={1.5} step={0.05} onChange={setSd} />
          {err && <p className="text-xs text-red-500">{err}</p>}
        </div>
      }
      inspector={
        <div>
          <Stat label="Minimum x" value={opt ? opt.x.toFixed(4) : "—"} />
          <Stat label="f(x) at min" value={opt ? opt.fx.toFixed(4) : "—"} />
          {uq && <>
            <Stat label="Output mean" value={uq.mean.toFixed(3)} />
            <Stat label="Output σ" value={uq.sd.toFixed(3)} />
            <Stat label="5–95%" value={`${uq.p05.toFixed(2)} … ${uq.p95.toFixed(2)}`} />
          </>}
        </div>
      }
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
