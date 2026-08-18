"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Lotka-Volterra predator-prey ODE with time series + phase portrait.
export function LotkaVolterraStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [a, setA] = useState(1.0); // prey growth
  const [b, setB] = useState(0.1); // predation
  const [c, setC] = useState(1.5); // predator death
  const [d, setD] = useState(0.075); // predator growth per prey

  useEffect(() => {
    const W = 540, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    let x = 10, y = 5; const dt = 0.01; const xs: number[] = [], ys: number[] = [];
    for (let t = 0; t < 4000; t++) { const dx = a * x - b * x * y, dy = -c * y + d * x * y; x += dx * dt; y += dy * dt; if (t % 4 === 0) { xs.push(x); ys.push(y); } }
    // time series (left 60%)
    const ox = 30, oy = 160, pw = 300, ph = 130; const mx = Math.max(...xs, ...ys) * 1.1;
    ctx.strokeStyle = "#334155"; ctx.strokeRect(ox, oy - ph, pw, ph);
    const plot = (arr: number[], col: string) => { ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); arr.forEach((v, i) => { const px = ox + (i / arr.length) * pw; const py = oy - (v / mx) * ph; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.stroke(); };
    plot(xs, "#22d3ee"); plot(ys, "#f472b6");
    ctx.font = "11px sans-serif"; ctx.fillStyle = "#22d3ee"; ctx.fillText("prey", ox + 6, oy - ph + 14); ctx.fillStyle = "#f472b6"; ctx.fillText("predator", ox + 50, oy - ph + 14);
    // phase portrait (right)
    const px0 = 360, py0 = 300, ppw = 160, pph = 260;
    ctx.strokeStyle = "#334155"; ctx.strokeRect(px0, py0 - pph, ppw, pph);
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 1.5; ctx.beginPath(); xs.forEach((xv, i) => { const gx = px0 + (xv / mx) * ppw; const gy = py0 - (ys[i] / mx) * pph; i ? ctx.lineTo(gx, gy) : ctx.moveTo(gx, gy); }); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.fillText("phase portrait", px0 + 6, py0 - pph + 14); ctx.fillText("prey →", px0 + ppw - 44, py0 + 14); ctx.save(); ctx.translate(px0 - 6, py0 - pph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("predator", -24, 0); ctx.restore();
  }, [a, b, c, d]);

  return (
    <StudioChrome title="Lotka-Volterra Predator-Prey" tagline="coupled population cycles"
      controls={<div>
        <Slider label="Prey growth a" value={a} min={0.2} max={2} step={0.05} onChange={setA} />
        <Slider label="Predation rate b" value={b} min={0.02} max={0.3} step={0.01} onChange={setB} />
        <Slider label="Predator death c" value={c} min={0.2} max={3} step={0.05} onChange={setC} />
        <Slider label="Predator growth d" value={d} min={0.02} max={0.2} step={0.005} onChange={setD} />
        <p className="mt-3 text-xs text-slate-500">Two coupled equations produce the classic boom-and-bust cycle: prey multiply, predators feast and multiply, prey crash, predators starve, and the cycle repeats. The phase portrait shows the closed orbit — populations forever chasing each other, never settling.</p>
      </div>}
      inspector={<div><Stat label="Prey equilibrium" value={(c / d).toFixed(1)} /><Stat label="Predator equilibrium" value={(a / b).toFixed(1)} /><Stat label="Dynamics" value="limit cycle" /></div>}
    ><canvas ref={canvasRef} width={540} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
