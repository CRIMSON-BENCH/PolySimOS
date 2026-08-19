"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sampleVectorField, evalXY } from "@/lib/engines/fieldmath";
import { parse } from "@/lib/engines/cas";
import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useCanvasDrag } from "@/lib/studioKit";

const W = 640, H = 480;
// Logical [-5,5]² domain <-> canvas pixels.
const toX = (x: number) => ((x + 5) / 10) * W;
const toY = (y: number) => H - ((y + 5) / 10) * H;
const fromX = (px: number) => (px / W) * 10 - 5;
const fromY = (py: number) => ((H - py) / H) * 10 - 5;

export function VectorFieldStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fx, setFx] = useState("-y");
  const [fy, setFy] = useState("x");
  const [err, setErr] = useState("");
  // The draggable probe point that seeds the live flow line lives in React state.
  const [seed, setSeed] = useState<[number, number]>([2.5, 0]);

  const arrows = useMemo(() => {
    try { setErr(""); return sampleVectorField(fx, fy, [-5, 5], [-5, 5], 22, 17); }
    catch (e) { setErr((e as Error).message); return []; }
  }, [fx, fy]);

  // Parsed field for integrating a streamline through the dragged probe point.
  const trees = useMemo(() => {
    try { return { u: parse(fx), v: parse(fy) }; } catch { return null; }
  }, [fx, fy]);

  // Drag the probe handle anywhere over the field; the flow line re-integrates live.
  useCanvasDrag(canvasRef, W, H, {
    pick: (px, py) => Math.hypot(toX(seed[0]) - px, toY(seed[1]) - py) < 16,
    move: (px, py) => setSeed([
      Math.max(-5, Math.min(5, fromX(px))),
      Math.max(-5, Math.min(5, fromY(py))),
    ]),
  });

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const sx = (x: number) => ((x + 5) / 10) * W, sy = (y: number) => H - ((y + 5) / 10) * H;
    let maxM = 0; for (const a of arrows) maxM = Math.max(maxM, Math.hypot(a.u, a.v) || 0);
    maxM = maxM || 1;
    for (const a of arrows) {
      const m = Math.hypot(a.u, a.v); if (!isFinite(m) || m === 0) continue;
      const len = 12 + (m / maxM) * 12; const ux = (a.u / m) * len, uy = (a.v / m) * len;
      const x0 = sx(a.x), y0 = sy(a.y), x1 = x0 + ux, y1 = y0 - uy;
      const t = Math.min(1, m / maxM); ctx.strokeStyle = `hsl(${190 - t * 130},90%,60%)`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      // arrowhead
      const ang = Math.atan2(-(uy), ux); ctx.beginPath(); ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - 5 * Math.cos(ang - 0.5), y1 - 5 * Math.sin(ang - 0.5)); ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - 5 * Math.cos(ang + 0.5), y1 - 5 * Math.sin(ang + 0.5)); ctx.stroke();
    }
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

    // Live flow line: integrate the field through the dragged probe point (arc-length RK2, both directions).
    if (trees) {
      const ds = 0.04;
      ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2.5;
      for (const dir of [1, -1]) {
        let x = seed[0], y = seed[1];
        ctx.beginPath(); ctx.moveTo(sx(x), sy(y));
        for (let i = 0; i < 600; i++) {
          const u1 = evalXY(trees.u, x, y), v1 = evalXY(trees.v, x, y);
          const m1 = Math.hypot(u1, v1); if (!isFinite(m1) || m1 < 1e-6) break;
          const hx = x + dir * ds / 2 * (u1 / m1), hy = y + dir * ds / 2 * (v1 / m1);
          const u2 = evalXY(trees.u, hx, hy), v2 = evalXY(trees.v, hx, hy);
          const m2 = Math.hypot(u2, v2); if (!isFinite(m2) || m2 < 1e-6) break;
          x += dir * ds * (u2 / m2); y += dir * ds * (v2 / m2);
          if (Math.abs(x) > 5 || Math.abs(y) > 5) break;
          ctx.lineTo(sx(x), sy(y));
        }
        ctx.stroke();
      }
      // draggable probe handle
      ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(sx(seed[0]), sy(seed[1]), 7, 0, 7); ctx.fill();
      ctx.strokeStyle = "#020617"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx(seed[0]), sy(seed[1]), 7, 0, 7); ctx.stroke();
    }
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("drag the green probe to trace the flow line through it", 12, 20);
  }, [arrows, seed, trees]);

  const presets: [string, string, string][] = [["Rotation", "-y", "x"], ["Source", "x", "y"], ["Saddle", "x", "-y"], ["Shear", "y", "0"], ["Spiral", "-y-0.2*x", "x-0.2*y"]];

  const explain = (() => {
    const u = fx.replace(/\s/g, ""), v = fy.replace(/\s/g, "");
    if (err) return "The current expressions could not be parsed — fix the typo or unsupported function before reading the plot.";
    if (u === "-y" && v === "x") return "A pure rotation field: every arrow is perpendicular to the radius, so the flow circles the origin with zero divergence and constant curl.";
    if (u === "x" && v === "y") return "A radial source: arrows point straight out from the origin, giving positive divergence everywhere and no rotation.";
    if (u === "x" && v === "-y") return "A saddle: flow is pushed out along the x-axis and pulled in along the y-axis — the classic hyperbolic fixed point.";
    if (u.includes("y") && v === "0") return "A shear field: horizontal flow whose speed grows with height, so a dropped particle drifts sideways faster the higher it starts.";
    return "Arrow direction shows the flow at each point and color encodes speed (warm = fast). Where arrows fan apart the divergence is positive; where they swirl the field has curl.";
  })();

  const code = `import numpy as np
import matplotlib.pyplot as plt
x, y = np.meshgrid(np.linspace(-5, 5, 22), np.linspace(-5, 5, 17))
# F(x, y) = (u, v)
u = ${fx}
v = ${fy}
plt.quiver(x, y, u, v); plt.gca().set_aspect("equal"); plt.show()`;

  return (
    <StudioChrome
      title="Vector Field Studio"
      tagline="F(x,y) = (u, v) · quiver plot · drag to trace a flow line"
      controls={
        <div>
          <label className="mb-1 block text-xs text-slate-500">u = fx(x, y)</label>
          <input value={fx} onChange={(e) => setFx(e.target.value)} className="mb-2 w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          <label className="mb-1 block text-xs text-slate-500">v = fy(x, y)</label>
          <input value={fy} onChange={(e) => setFy(e.target.value)} className="mb-3 w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          <div className="flex flex-wrap gap-1">
            {presets.map(([name, a, b]) => (
              <button key={name} onClick={() => { setFx(a); setFy(b); }} className="rounded-md border border-slate-300 px-2 py-0.5 text-[11px] text-slate-600 hover:border-cyan-400 dark:border-slate-700 dark:text-slate-400">{name}</button>
            ))}
          </div>
          {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
          <ShareBar code={code} />
        </div>
      }
      inspector={<div><Stat label="Arrows" value={String(arrows.length)} /><Stat label="Domain" value="[-5,5]²" /><Stat label="Probe" value={`(${seed[0].toFixed(1)}, ${seed[1].toFixed(1)})`} /><Equation tex={`\\mathbf{F}(x,y) = \\big(\\,P,\\ Q\\,\\big) = \\big(\\,${fx.replace(/\*/g, " \\cdot ")},\\ ${fy.replace(/\*/g, " \\cdot ")}\\,\\big)`} /><ExplainResult text={explain} /></div>}
    >
      <canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[460px] rounded-lg" />
    </StudioChrome>
  );
}
