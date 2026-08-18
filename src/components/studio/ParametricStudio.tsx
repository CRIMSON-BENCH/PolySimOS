"use client";

import { useEffect, useRef, useState } from "react";
import { parse, evaluate } from "@/lib/engines/cas";
import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi } from "@/lib/studioKit";

const W = 560, H = 480;

export function ParametricStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [xt, setXt] = useState("cos(3*t)");
  const [yt, setYt] = useState("sin(4*t)");
  const [tMax, setTMax] = useState(6.28);
  const [err, setErr] = useState("");
  const rafRef = useRef(0);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    let tx, ty; try { tx = parse(xt); ty = parse(yt); setErr(""); } catch (e) { setErr((e as Error).message); return; }
    const cx = W / 2, cy = H / 2, S = 180; let anim = 0;
    const loop = () => {
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
      let px = 0, py = 0;
      for (let t = 0; t <= tMax; t += tMax / 800) { const x = evaluate(tx!, { t }), y = evaluate(ty!, { t }); px = cx + x * S; py = cy - y * S; t === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.stroke();
      const tt = (anim % 100) / 100 * tMax; const mx = cx + evaluate(tx!, { t: tt }) * S, my = cy - evaluate(ty!, { t: tt }) * S;
      ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(mx, my, 6, 0, 7); ctx.fill();
      anim++; rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [xt, yt, tMax]);

  const presets: [string, string, string][] = [["Lissajous", "cos(3*t)", "sin(4*t)"], ["Rose", "cos(5*t)*cos(t)", "cos(5*t)*sin(t)"], ["Spiral", "t*cos(t)/6", "t*sin(t)/6"], ["Heart", "16*sin(t)^3/16", "(13*cos(t)-5*cos(2*t))/16"], ["Circle", "cos(t)", "sin(t)"]];

  const explain = err
    ? `The current x(t) or y(t) has a parse error, so nothing is traced — fix the expression to continue.`
    : tMax >= 6.2
    ? `x(t)=${xt}, y(t)=${yt} are swept over t from 0 to ${tMax.toFixed(1)} — a full 2π range, so periodic curves close into a complete loop.`
    : `x(t)=${xt}, y(t)=${yt} are swept over t from 0 to ${tMax.toFixed(1)}; under a full 2π cycle a periodic shape may appear as an open arc rather than a closed loop.`;

  const code = `import numpy as np
import matplotlib.pyplot as plt
from numpy import sin, cos, tan, pi, exp, sqrt
t = np.linspace(0, ${tMax}, 800)
x = ${xt.replace(/\^/g, "**")}
y = ${yt.replace(/\^/g, "**")}
plt.plot(x, y); plt.gca().set_aspect("equal"); plt.show()`;

  return (
    <StudioChrome title="Parametric Curve Grapher" tagline="x(t), y(t) traced over time"
      controls={<div>
        <label className="mb-1 block text-xs text-slate-500">x(t)</label>
        <input value={xt} onChange={(e) => setXt(e.target.value)} className="mb-2 w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        <label className="mb-1 block text-xs text-slate-500">y(t)</label>
        <input value={yt} onChange={(e) => setYt(e.target.value)} className="mb-2 w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        <div className="flex flex-wrap gap-1">{presets.map(([n, x, y]) => <button key={n} onClick={() => { setXt(x); setYt(y); }} className="rounded-md border border-slate-300 px-2 py-0.5 text-[10px] text-slate-600 dark:border-slate-700 dark:text-slate-400">{n}</button>)}</div>
        {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="x(t)" value="param" /><Stat label="y(t)" value="param" /><Stat label="t range" value={`0…${tMax.toFixed(1)}`} /><Equation tex={`x(t) = \\text{${xt}}, \\quad y(t) = \\text{${yt}}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[460px] rounded-lg" /></StudioChrome>
  );
}
